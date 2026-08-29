import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import {
  Attachment,
  MessageRecord,
  ToolCallRecord,
  ApiKeyEntry,
  SessionSummary,
  ChoiceQuestion
} from "./types";
import { clientForStyle, LlmClient, LlmMessage, LlmStreamEvent } from "./llmClients";
import { PROVIDERS } from "./providers";
import { buildSystemPrompt } from "./systemPrompt";
import { TOOL_DEFINITIONS, READ_ONLY_TOOLS, COMPUTER_USE_TOOLS } from "./tools/definitions";
import { executeTool } from "./tools/executor";
import { readDertetCodeMd } from "./tools/dertetCodeMd";
import { appendProjectHistory, readProjectHistory } from "./tools/projectHistory";
import * as store from "./store";

export const agentEvents = new EventEmitter();
agentEvents.setMaxListeners(100);

const IDLE_STREAM_TIMEOUT_MS = 60_000; // no bytes from the model for 60s -> treat as hung
const MAX_AGENT_STEPS = 40; // hard cap on tool-call round trips per turn, prevents runaway loops
const RETRY_DELAYS_MS = [1000, 3000, 5000, 15000, 30000, 45000, 50000];
const SLASH_COMMANDS = ["/compact", "/status", "/clear", "/help", "/model"];

const REMEMBER_RE = /\[\[REMEMBER:\s*(.+?)\s*]]/gis;
const LESSON_RE = /\[\[LESSON:\s*(.+?)\s*]]/gis;
const ASK_CHOICE_RE = /\[\[ASK_CHOICE:\s*(\{[\s\S]*?\})\s*]]/gi;

const pendingApprovals = new Map<string, (approved: boolean) => void>();
const pendingComputerUsePermission = new Map<string, (allow: boolean, remember: boolean) => void>();
const pendingChoiceResponses = new Map<string, (answer: string) => void>();
const activeControllers = new Map<string, AbortController>();
let computerUseGrantedThisRun = false;

export function approveToolCall(toolCallId: string, approved: boolean): void {
  pendingApprovals.get(toolCallId)?.(approved);
  pendingApprovals.delete(toolCallId);
}

export function respondComputerUsePermission(requestId: string, allow: boolean, remember: boolean): void {
  pendingComputerUsePermission.get(requestId)?.(allow, remember);
  pendingComputerUsePermission.delete(requestId);
}

export function respondChoice(requestId: string, answer: string): void {
  pendingChoiceResponses.get(requestId)?.(answer);
  pendingChoiceResponses.delete(requestId);
}

export function stopSession(sessionId: string): void {
  activeControllers.get(sessionId)?.abort();
}

async function cancellableSleep(ms: number, controller: AbortController): Promise<void> {
  if (controller.signal.aborted) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    controller.signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

async function* withIdleTimeout(
  gen: AsyncGenerator<LlmStreamEvent>,
  ms: number,
  controller: AbortController
): AsyncGenerator<LlmStreamEvent> {
  while (true) {
    let timer!: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), ms);
    });
    const result = await Promise.race([gen.next(), timeoutPromise]);
    clearTimeout(timer);
    if (result === "timeout") {
      controller.abort();
      throw new Error(`Немає відповіді від моделі понад ${Math.round(ms / 1000)}с — з'єднання перервано.`);
    }
    if (result.done) return;
    yield result.value;
  }
}

function newMessage(sessionId: string, role: MessageRecord["role"], content = ""): MessageRecord {
  return { id: randomUUID(), sessionId, role, content, createdAt: Date.now() };
}

/** Rough token estimate (chars/4) — good enough for a "/status" ballpark, not exact provider accounting. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function requestToolApproval(sessionId: string, messageId: string, toolCall: ToolCallRecord): Promise<boolean> {
  agentEvents.emit("tool_call_update", { sessionId, messageId, toolCall });
  return new Promise((resolve) => {
    pendingApprovals.set(toolCall.id, resolve);
  });
}

async function requestComputerUsePermission(sessionId: string): Promise<boolean> {
  if (computerUseGrantedThisRun) return true;
  const requestId = randomUUID();
  agentEvents.emit("computer_use_permission_request", { sessionId, requestId });
  return new Promise((resolve) => {
    pendingComputerUsePermission.set(requestId, (allow, remember) => {
      if (allow && remember) computerUseGrantedThisRun = true;
      resolve(allow);
    });
  });
}

async function requestChoice(sessionId: string, question: ChoiceQuestion): Promise<string> {
  const requestId = randomUUID();
  agentEvents.emit("choice_request", { sessionId, requestId, question });
  return new Promise((resolve) => {
    pendingChoiceResponses.set(requestId, resolve);
  });
}

function stripMarkersForDisplay(text: string): string {
  return text.replace(REMEMBER_RE, "").replace(LESSON_RE, "").replace(ASK_CHOICE_RE, "").trim();
}

function extractMarkers(text: string): {
  cleaned: string;
  facts: string[];
  lessons: string[];
  choice: ChoiceQuestion | null;
} {
  const facts: string[] = [];
  const lessons: string[] = [];
  let choice: ChoiceQuestion | null = null;

  let cleaned = text.replace(REMEMBER_RE, (_m, fact) => {
    if (fact?.trim()) facts.push(fact.trim());
    return "";
  });
  cleaned = cleaned.replace(LESSON_RE, (_m, lesson) => {
    if (lesson?.trim()) lessons.push(lesson.trim());
    return "";
  });
  cleaned = cleaned.replace(ASK_CHOICE_RE, (_m, json) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed.question === "string" && Array.isArray(parsed.options) && parsed.options.length) {
        choice = {
          question: parsed.question,
          options: parsed.options.slice(0, 5).map((o: unknown) => String(o)),
          allowCustom: parsed.allowCustom !== false,
          page: typeof parsed.page === "number" ? parsed.page : undefined,
          totalPages: typeof parsed.totalPages === "number" ? parsed.totalPages : undefined
        };
      }
    } catch {
      // malformed choice JSON — ignore, just strip the marker
    }
    return "";
  });

  return { cleaned: cleaned.trim(), facts, lessons, choice };
}

async function generateTitle(
  client: LlmClient,
  apiKey: ApiKeyEntry,
  firstUserText: string,
  firstAssistantText: string
): Promise<string | null> {
  try {
    const gen = client.stream({
      baseUrl: apiKey.baseUrl,
      apiKey: apiKey.apiKey,
      model: apiKey.model,
      systemPrompt:
        "Generate a very short chat title (2-5 words, no surrounding quotes, no trailing punctuation) " +
        "summarizing the conversation below, in the same language the user wrote in. Reply with ONLY the " +
        "title text and nothing else.",
      messages: [
        { role: "user", content: firstUserText.slice(0, 2000) },
        { role: "assistant", content: firstAssistantText.slice(0, 2000) }
      ],
      tools: [],
      signal: new AbortController().signal
    });
    let text = "";
    for await (const event of gen) {
      if (event.type === "delta") text += event.text;
    }
    const title = text
      .trim()
      .replace(/^[\s"'«»]+|[\s"'«»]+$/g, "")
      .replace(/[.!?]+$/, "")
      .slice(0, 60);
    return title || null;
  } catch {
    return null;
  }
}

/**
 * Handles a "/command" typed into a Dertet Code session locally — never reaches the model except
 * /compact, which makes exactly one summarization call. Returns true if the text was a recognized
 * command (and has already been fully handled: persisted + events emitted), false otherwise.
 */
async function handleSlashCommand(
  sessionId: string,
  session: SessionSummary,
  apiKey: ApiKeyEntry,
  client: LlmClient,
  userText: string
): Promise<boolean> {
  const trimmed = userText.trim();
  const cmd = trimmed.split(/\s+/)[0]?.toLowerCase();
  if (!cmd || !SLASH_COMMANDS.includes(cmd)) return false;

  const userMsg = newMessage(sessionId, "user", trimmed);
  await store.appendMessage(sessionId, userMsg);
  agentEvents.emit("message_done", { sessionId, message: userMsg });

  let responseText: string;

  switch (cmd) {
    case "/help":
      responseText =
        "Доступні команди:\n" +
        "/compact — стиснути історію чату в короткий підсумок (звільняє контекст)\n" +
        "/status — оцінка використаних токенів у цьому чаті + серія днів використання Dertet Code\n" +
        "/clear — очистити історію цього чату\n" +
        "/model — показати поточного провайдера й модель\n" +
        "/help — цей список";
      break;

    case "/model": {
      const provider = PROVIDERS[apiKey.providerId];
      responseText = `Провайдер: ${provider?.displayName ?? apiKey.providerId}\nМодель: ${apiKey.model}`;
      break;
    }

    case "/status": {
      const streak = await store.loadStreak();
      const usage = session.usage ?? { inputTokens: 0, outputTokens: 0 };
      responseText =
        `Оцінка вхідних токенів у цьому чаті: ~${usage.inputTokens.toLocaleString("uk-UA")}\n` +
        `Оцінка вихідних токенів у цьому чаті: ~${usage.outputTokens.toLocaleString("uk-UA")}\n` +
        `Серія використання Dertet Code: ${streak.streakDays} дн. поспіль\n` +
        `(оцінка токенів приблизна, не точний підрахунок провайдера)`;
      break;
    }

    case "/clear": {
      await store.saveMessages(sessionId, []);
      responseText = "Історію цього чату очищено.";
      break;
    }

    case "/compact": {
      const history = (await store.loadMessages(sessionId)).flatMap(toLlmMessages);
      if (history.length === 0) {
        responseText = "Нічого стискати — історія порожня.";
      } else {
        try {
          const gen = client.stream({
            baseUrl: apiKey.baseUrl,
            apiKey: apiKey.apiKey,
            model: apiKey.model,
            systemPrompt:
              "Summarize the conversation so far concisely (short bullet points are fine) — key facts, " +
              "decisions made, and the current state of any task in progress — so this summary can fully " +
              "replace the raw history and work can continue seamlessly from it. Reply with ONLY the summary.",
            messages: history,
            tools: [],
            signal: new AbortController().signal
          });
          let summary = "";
          for await (const event of gen) {
            if (event.type === "delta") summary += event.text;
          }
          summary = summary.trim() || "(не вдалося створити підсумок)";
          await store.saveMessages(sessionId, []);
          responseText = `📎 Історію стиснуто в підсумок:\n\n${summary}`;
        } catch (e: any) {
          responseText = `Не вдалося стиснути історію: ${e?.message ?? e}`;
        }
      }
      break;
    }

    default:
      responseText = "";
  }

  const respMsg = newMessage(sessionId, "assistant", responseText);
  await store.appendMessage(sessionId, respMsg);
  agentEvents.emit("message_done", { sessionId, message: respMsg });
  agentEvents.emit("session_idle", { sessionId });
  return true;
}

export async function runTurn(
  sessionId: string,
  userText: string,
  attachments: Attachment[]
): Promise<void> {
  const settings = await store.loadSettings();
  const sessions = await store.listSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    agentEvents.emit("error", { sessionId, message: "Сесію не знайдено." });
    return;
  }
  const apiKey: ApiKeyEntry | undefined = settings.apiKeys.find((k) => k.id === session.apiKeyId);
  if (!apiKey) {
    agentEvents.emit("error", { sessionId, message: "Немає активного API ключа для цієї сесії." });
    return;
  }
  const provider = PROVIDERS[apiKey.providerId];
  const client = clientForStyle(provider.apiStyle);
  const isDertetCode = session.kind === "dertet_code";

  if (isDertetCode && attachments.length === 0 && (await handleSlashCommand(sessionId, session, apiKey, client, userText))) {
    return;
  }

  const priorMessages = await store.loadMessages(sessionId);
  const isFirstMessage = priorMessages.length === 0;

  const userMsg = newMessage(sessionId, "user", userText);
  userMsg.attachments = attachments;
  await store.appendMessage(sessionId, userMsg);
  await store.touchSession(sessionId);

  const controller = new AbortController();
  activeControllers.set(sessionId, controller);
  computerUseGrantedThisRun = settings.computerUseAllowed === "always";

  const initialFolders = session.folderPaths ?? [];
  const tools = isDertetCode ? TOOL_DEFINITIONS : [];
  const memory = settings.personalizationEnabled ? await store.loadMemory() : { enabled: false, notes: [], updatedAt: 0 };
  const lessonsStore = await store.loadLessons();
  const dertetCodeMd = isDertetCode && initialFolders[0] ? await readDertetCodeMd(initialFolders[0]) : null;
  const projectHistory = isDertetCode && initialFolders[0] ? await readProjectHistory(initialFolders[0]) : null;

  let lastAssistantText = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    let history = (await store.loadMessages(sessionId)).flatMap(toLlmMessages);
    let steps = 0;

    while (steps < MAX_AGENT_STEPS) {
      if (controller.signal.aborted) break;
      steps++;

      // Re-read mode/folders fresh each step — the user may have switched mode (e.g. Default -> Auto)
      // or added/removed a folder mid-turn, and that must take effect on the very next step, not
      // only on the next user message.
      const liveSessions = await store.listSessions();
      const liveSession = liveSessions.find((s) => s.id === sessionId) ?? session;
      const liveMode = liveSession.mode;
      const liveFolders = liveSession.folderPaths ?? [];

      const systemPrompt = buildSystemPrompt({
        providerId: apiKey.providerId,
        model: apiKey.model,
        kind: session.kind,
        mode: liveMode,
        folders: liveFolders,
        dertetCodeMd,
        projectHistory,
        memoryNotes: memory.enabled ? memory.notes : [],
        personalizationEnabled: settings.personalizationEnabled,
        userSystemPrompt: settings.systemPrompt,
        lessons: lessonsStore.lessons
      });

      const assistantMsg = newMessage(sessionId, "assistant");
      let buffer = "";
      let toolCalls: ToolCallRecord[] = [];
      let streamError: string | null = null;
      let retryAttempt = 0;

      for (;;) {
        buffer = "";
        toolCalls = [];
        streamError = null;
        try {
          const gen = client.stream({
            baseUrl: apiKey.baseUrl,
            apiKey: apiKey.apiKey,
            model: apiKey.model,
            systemPrompt,
            messages: history,
            tools,
            signal: controller.signal
          });
          for await (const event of withIdleTimeout(gen, IDLE_STREAM_TIMEOUT_MS, controller)) {
            if (event.type === "delta") {
              buffer += event.text;
              agentEvents.emit("delta", { sessionId, messageId: assistantMsg.id, text: stripMarkersForDisplay(buffer) });
            } else if (event.type === "tool_call") {
              toolCalls.push({
                id: event.call.id,
                toolName: event.call.name,
                args: event.call.args,
                status: "running"
              });
            } else if (event.type === "error") {
              streamError = event.message;
            }
          }
        } catch (e: any) {
          streamError = controller.signal.aborted ? null : e?.message ?? String(e);
        }

        if (controller.signal.aborted) break;
        if (!streamError) {
          if (retryAttempt > 0) agentEvents.emit("retry_resolved", { sessionId });
          break;
        }

        const delay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)];
        retryAttempt++;
        agentEvents.emit("retry", { sessionId, attempt: retryAttempt, delayMs: delay, message: streamError });
        await cancellableSleep(delay, controller);
        if (controller.signal.aborted) {
          streamError = null;
          break;
        }
      }

      totalInputTokens += estimateTokens(systemPrompt) + history.reduce((n, m) => n + estimateTokens(m.content), 0);
      totalOutputTokens += estimateTokens(buffer);

      const { cleaned: finalText, facts, lessons: newLessons, choice } = extractMarkers(buffer);
      if (streamError) {
        if (!finalText && toolCalls.length === 0) {
          assistantMsg.isError = true;
          assistantMsg.content = streamError;
        } else {
          assistantMsg.content = `${finalText}${finalText ? "\n\n" : ""}⚠️ ${streamError}`;
        }
      } else {
        assistantMsg.content = finalText;
        lastAssistantText = finalText;
      }
      if (toolCalls.length) assistantMsg.toolCalls = toolCalls;

      if (memory.enabled && facts.length) {
        memory.notes.push(...facts);
        memory.updatedAt = Date.now();
        await store.saveMemory(memory);
      }
      if (newLessons.length) {
        lessonsStore.lessons.push(...newLessons);
        lessonsStore.updatedAt = Date.now();
        await store.saveLessons(lessonsStore);
      }

      await store.appendMessage(sessionId, assistantMsg);
      history.push({ role: "assistant", content: finalText, toolCalls: toolCalls.map((t) => ({ id: t.id, name: t.toolName, args: t.args })) });
      agentEvents.emit("message_done", { sessionId, message: assistantMsg });

      if (controller.signal.aborted) break;

      let choiceHandledThisStep = false;
      if (!isDertetCode && !streamError && choice) {
        choiceHandledThisStep = true;
        const answer = await requestChoice(sessionId, choice);
        if (!controller.signal.aborted) {
          const answerMsg = newMessage(sessionId, "user", answer);
          await store.appendMessage(sessionId, answerMsg);
          history.push({ role: "user", content: answer });
          agentEvents.emit("message_done", { sessionId, message: answerMsg });
        }
      }

      if (toolCalls.length === 0 && !choiceHandledThisStep) break;

      for (const call of toolCalls) {
        if (controller.signal.aborted) {
          call.status = "denied";
          call.resultSummary = "Зупинено користувачем.";
          agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });
          history.push({ role: "tool", content: "Stopped by user.", toolCallId: call.id, toolName: call.toolName });
          continue;
        }

        if (call.toolName === "ask_user_choice") {
          const rawArgs = call.args as any;
          const options = Array.isArray(rawArgs.options) ? rawArgs.options.slice(0, 5).map((o: unknown) => String(o)) : [];
          const question: ChoiceQuestion = {
            question: String(rawArgs.question ?? ""),
            options,
            allowCustom: rawArgs.allowCustom !== "false" && rawArgs.allowCustom !== false
          };
          call.status = "running";
          agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });
          const answer = await requestChoice(sessionId, question);
          call.status = "done";
          call.resultSummary = answer;
          agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });
          history.push({ role: "tool", content: answer, toolCallId: call.id, toolName: call.toolName });
          continue;
        }

        if (COMPUTER_USE_TOOLS.has(call.toolName) && settings.computerUseAllowed === "never") {
          call.status = "denied";
          call.resultSummary = "Керування комп'ютером заборонено в налаштуваннях.";
          agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });
          history.push({ role: "tool", content: "Computer use is disabled in settings.", toolCallId: call.id, toolName: call.toolName });
          continue;
        }

        if (COMPUTER_USE_TOOLS.has(call.toolName) && settings.computerUseAllowed !== "always") {
          const allowed = await requestComputerUsePermission(sessionId);
          if (!allowed) {
            call.status = "denied";
            call.resultSummary = "Користувач не надав дозвіл на керування комп'ютером.";
            agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });
            history.push({ role: "tool", content: "User denied computer-use permission.", toolCallId: call.id, toolName: call.toolName });
            continue;
          }
        }

        const needsApproval =
          liveMode !== "auto" && !READ_ONLY_TOOLS.has(call.toolName) && !COMPUTER_USE_TOOLS.has(call.toolName);
        const planBlocked = liveMode === "plan" && !READ_ONLY_TOOLS.has(call.toolName);

        if (planBlocked) {
          call.status = "denied";
          call.resultSummary = "Заблоковано: режим Plan дозволяє лише читання.";
          agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });
          history.push({
            role: "tool",
            content: "This action is blocked in Plan mode (read-only). Describe it in your plan instead.",
            toolCallId: call.id,
            toolName: call.toolName
          });
          continue;
        }

        if (needsApproval) {
          call.status = "pending_approval";
          const approved = await requestToolApproval(sessionId, assistantMsg.id, call);
          if (!approved) {
            call.status = "denied";
            call.resultSummary = "Відхилено користувачем.";
            agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });
            history.push({ role: "tool", content: "User denied this action.", toolCallId: call.id, toolName: call.toolName });
            continue;
          }
        }

        call.status = "running";
        call.startedAt = Date.now();
        agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });

        const result = await executeTool(
          { id: call.id, name: call.toolName, args: call.args },
          { folders: liveFolders }
        );

        call.finishedAt = Date.now();
        call.status = result.ok ? "done" : "error";
        call.resultSummary = result.output.slice(0, 4000);
        if (result.diff) call.diff = result.diff;
        if (!result.ok) call.error = result.output;
        agentEvents.emit("tool_call_update", { sessionId, messageId: assistantMsg.id, toolCall: call });

        history.push({ role: "tool", content: result.output, toolCallId: call.id, toolName: call.toolName });
        if (result.imageBase64) {
          // Provider "tool" / "tool_result" message shapes are text-only in practice — the reliable,
          // provider-agnostic way to actually get an image in front of the model is a follow-up user
          // message carrying it, which every client here already knows how to attach correctly.
          history.push({
            role: "user",
            content: "(screenshot for the tool call above)",
            attachments: [
              { fileName: "screenshot.png", mimeType: result.imageMimeType ?? "image/png", kind: "image", base64Data: result.imageBase64 }
            ]
          });
        }
      }

      await store.upsertMessage(sessionId, assistantMsg);
    }

    if (steps >= MAX_AGENT_STEPS) {
      const limitMsg = newMessage(
        sessionId,
        "assistant",
        "Досягнуто ліміту кроків агента для цього повідомлення. Напишіть ще раз, щоб продовжити."
      );
      await store.appendMessage(sessionId, limitMsg);
      agentEvents.emit("message_done", { sessionId, message: limitMsg });
    }

    if (isDertetCode) {
      await store.addSessionUsage(sessionId, totalInputTokens, totalOutputTokens);
      await store.recordDertetCodeActivity();
      if (initialFolders[0] && lastAssistantText) {
        await appendProjectHistory(initialFolders[0], sessionId, userText, lastAssistantText);
      }
    }

    if (isFirstMessage && !session.title.trim() && !controller.signal.aborted && lastAssistantText) {
      const title = await generateTitle(client, apiKey, userText, lastAssistantText);
      if (title) {
        await store.updateSession(sessionId, { title });
        agentEvents.emit("session_updated", { sessionId });
      }
    }
  } catch (e: any) {
    agentEvents.emit("error", { sessionId, message: e?.message ?? String(e) });
  } finally {
    activeControllers.delete(sessionId);
    await store.touchSession(sessionId);
    agentEvents.emit("session_idle", { sessionId });
  }
}

/**
 * Expands a persisted message into the LlmMessage(s) the provider APIs require. Assistant
 * messages that made tool calls MUST be immediately followed by one tool-result message per
 * call (that's a hard API contract for OpenAI/Anthropic/Gemini) — reconstructing history from
 * disk has to re-synthesize those from each ToolCallRecord's stored result, not just replay the
 * assistant message alone.
 */
function toLlmMessages(m: MessageRecord): LlmMessage[] {
  const out: LlmMessage[] = [
    {
      role: m.role === "system" ? "user" : m.role,
      content: m.content,
      attachments: m.attachments,
      toolCalls: m.toolCalls?.map((t) => ({ id: t.id, name: t.toolName, args: t.args }))
    }
  ];
  if (m.toolCalls?.length) {
    for (const call of m.toolCalls) {
      out.push({
        role: "tool",
        content: call.resultSummary ?? (call.status === "denied" ? "Denied by user." : "(no result)"),
        toolCallId: call.id,
        toolName: call.toolName
      });
    }
  }
  return out;
}
