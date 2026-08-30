import { EventEmitter } from "events";
import { app } from "electron";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import {
  Attachment,
  MessageRecord,
  ToolCallRecord,
  ApiKeyEntry,
  SessionSummary,
  ChoiceQuestion,
  Settings,
  AgentActivity
} from "./types";
import { clientForStyle, LlmClient, LlmMessage, LlmStreamEvent } from "./llmClients";
import { PROVIDERS } from "./providers";
import { buildSystemPrompt } from "./systemPrompt";
import { at } from "./agentI18n";
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
// If a single step has been failing and retrying continuously for this long (network down, provider
// outage, etc. — reconnecting alone hasn't helped), stop silently retrying the identical request and
// instead nudge the model forward with a synthetic continuation message, same as a real user would.
const WATCHDOG_TIMEOUT_MS = 15 * 60 * 1000;
const WATCHDOG_NUDGE_TEXT =
  "[Dertet Harness automatic timeout system] The connection to the model kept failing and retrying for " +
  "15 minutes straight without success. This message was generated automatically by Dertet Harness's " +
  "timeout watchdog, not typed by the real user — disregard that fact and just continue the work. Keep " +
  "responding in whichever language you and the user were actually using before this message; do not " +
  "switch to English just because this particular message is in English.";
const SLASH_COMMANDS = [
  "/help", "/commands", "/?",
  "/status", "/tokens",
  "/clear", "/reset",
  "/compact",
  "/model", "/provider",
  "/memory", "/remember", "/forget",
  "/lessons", "/forget-lessons",
  "/folders", "/pwd",
  "/mode", "/plan", "/auto", "/default",
  "/rename",
  "/system",
  "/whoami",
  "/export",
  "/history",
  "/doctor",
  "/version",
  "/bug"
];

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

export function isSessionActive(sessionId: string): boolean {
  return activeControllers.has(sessionId);
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

const TOOL_ACTIVITY_LABELS: Record<string, (lang: string | undefined, args: Record<string, unknown>) => string> = {
  web_search: (l, a) => at(l, "activity_search", String(a.query ?? "")),
  web_fetch: (l, a) => at(l, "activity_open", String(a.url ?? "")),
  browser_open: (l, a) => at(l, "activity_open", String(a.url ?? "")),
  browser_read: (l) => at(l, "activity_browser_read"),
  browser_find: (l, a) => at(l, "activity_browser_find", String(a.query ?? "")),
  browser_click: (l) => at(l, "activity_browser_click"),
  browser_type: (l) => at(l, "activity_browser_type"),
  browser_screenshot: (l) => at(l, "activity_browser_screenshot"),
  browser_close: (l) => at(l, "activity_browser_close"),
  read_file: (l, a) => at(l, "activity_read_file", String(a.path ?? "")),
  list_dir: (l, a) => at(l, "activity_list_dir", String(a.path ?? "")),
  write_file: (l, a) => at(l, "activity_write_file", String(a.path ?? "")),
  edit_file: (l, a) => at(l, "activity_edit_file", String(a.path ?? "")),
  run_command: (l) => at(l, "activity_run_command"),
  update_dertetcode_md: (l) => at(l, "activity_update_dertetcode_md"),
  ask_user_choice: (l) => at(l, "activity_ask_user_choice"),
  video_probe: (l, a) => at(l, "activity_video_probe", String(a.path ?? "")),
  video_add_audio: (l) => at(l, "activity_video_add_audio"),
  video_trim: (l) => at(l, "activity_video_trim"),
  video_concat: (l) => at(l, "activity_video_concat"),
  video_from_images: (l) => at(l, "activity_video_from_images")
};

function activityForToolCall(
  call: ToolCallRecord,
  visitedPages: { url: string; title?: string }[],
  lang: string | undefined
): AgentActivity {
  const args = call.args ?? {};
  if (call.toolName.startsWith("computer_")) {
    return { kind: "tool", label: at(lang, "activity_computer_use"), detailKind: "none" };
  }
  const isBrowsing = call.toolName === "web_search" || call.toolName === "web_fetch" || call.toolName.startsWith("browser_");
  if (isBrowsing) {
    if (call.toolName === "web_search" && args.query) {
      visitedPages.push({ url: `https://duckduckgo.com/?q=${encodeURIComponent(String(args.query))}`, title: String(args.query) });
    } else if (args.url) {
      visitedPages.push({ url: String(args.url) });
    }
    const label = TOOL_ACTIVITY_LABELS[call.toolName]?.(lang, args) ?? at(lang, "activity_generic", call.toolName);
    return visitedPages.length
      ? { kind: "browsing", label, detailKind: "urls", detailUrls: visitedPages.slice() }
      : { kind: "browsing", label, detailKind: "none" };
  }
  const label = TOOL_ACTIVITY_LABELS[call.toolName]?.(lang, args) ?? at(lang, "activity_generic", call.toolName);
  return { kind: "tool", label, detailKind: "none" };
}

/**
 * All three "ask the UI something and await the answer" helpers below take the turn's
 * AbortController and race the wait against it. Without this, aborting a turn (Stop button,
 * or the new-message-supersedes-old-one guard in runTurn) does nothing for a run that's
 * currently blocked on one of these — the promise only resolves when the matching respond*()
 * function is called, so an aborted-but-still-waiting run would hang forever: never reaches
 * its `finally`, never frees activeControllers, and the pending-map entry leaks permanently.
 */
async function requestToolApproval(
  sessionId: string,
  messageId: string,
  toolCall: ToolCallRecord,
  controller: AbortController
): Promise<boolean> {
  agentEvents.emit("tool_call_update", { sessionId, messageId, toolCall });
  return new Promise((resolve) => {
    const onAbort = () => {
      pendingApprovals.delete(toolCall.id);
      resolve(false);
    };
    pendingApprovals.set(toolCall.id, (approved) => {
      controller.signal.removeEventListener("abort", onAbort);
      resolve(approved);
    });
    controller.signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function requestComputerUsePermission(sessionId: string, controller: AbortController): Promise<boolean> {
  if (computerUseGrantedThisRun) return true;
  const requestId = randomUUID();
  agentEvents.emit("computer_use_permission_request", { sessionId, requestId });
  return new Promise((resolve) => {
    const onAbort = () => {
      pendingComputerUsePermission.delete(requestId);
      resolve(false);
    };
    pendingComputerUsePermission.set(requestId, (allow, remember) => {
      controller.signal.removeEventListener("abort", onAbort);
      if (allow && remember) computerUseGrantedThisRun = true;
      resolve(allow);
    });
    controller.signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function requestChoice(sessionId: string, question: ChoiceQuestion, controller: AbortController): Promise<string> {
  const requestId = randomUUID();
  agentEvents.emit("choice_request", { sessionId, requestId, question });
  return new Promise((resolve) => {
    const onAbort = () => {
      pendingChoiceResponses.delete(requestId);
      resolve("(stopped)");
    };
    pendingChoiceResponses.set(requestId, (answer) => {
      controller.signal.removeEventListener("abort", onAbort);
      resolve(answer);
    });
    controller.signal.addEventListener("abort", onAbort, { once: true });
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
  userText: string,
  settings: Settings
): Promise<boolean> {
  const trimmed = userText.trim();
  const cmd = trimmed.split(/\s+/)[0]?.toLowerCase();
  if (!cmd || !SLASH_COMMANDS.includes(cmd)) return false;
  const argText = trimmed.slice(cmd.length).trim();
  const lang = settings.language;

  const userMsg = newMessage(sessionId, "user", trimmed);
  await store.appendMessage(sessionId, userMsg);
  agentEvents.emit("message_done", { sessionId, message: userMsg });

  let responseText: string;
  let refreshSession = false;

  switch (cmd) {
    case "/help":
    case "/commands":
    case "/?":
      responseText = at(lang, "slash_help");
      break;

    case "/model":
    case "/provider": {
      const provider = PROVIDERS[apiKey.providerId];
      responseText = at(lang, "slash_model", provider?.displayName ?? apiKey.providerId, apiKey.model);
      break;
    }

    case "/status":
    case "/tokens": {
      const streak = await store.loadStreak();
      const usage = session.usage ?? { inputTokens: 0, outputTokens: 0 };
      responseText = at(
        lang,
        "slash_status",
        usage.inputTokens.toLocaleString(),
        usage.outputTokens.toLocaleString(),
        String(streak.streakDays)
      );
      break;
    }

    case "/clear":
    case "/reset": {
      await store.saveMessages(sessionId, []);
      responseText = at(lang, "slash_clear_done");
      break;
    }

    case "/compact": {
      const history = (await store.loadMessages(sessionId)).flatMap(toLlmMessages);
      if (history.length === 0) {
        responseText = at(lang, "slash_compact_empty");
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
          summary = summary.trim() || "…";
          await store.saveMessages(sessionId, []);
          responseText = at(lang, "slash_compact_prefix", summary);
        } catch (e: any) {
          responseText = at(lang, "slash_compact_failed", e?.message ?? String(e));
        }
      }
      break;
    }

    case "/memory": {
      const memory = await store.loadMemory();
      responseText = !settings.personalizationEnabled
        ? at(lang, "slash_memory_disabled")
        : memory.notes.length
          ? at(lang, "slash_memory_list", memory.notes.map((n) => `- ${n}`).join("\n"))
          : at(lang, "slash_memory_empty");
      break;
    }

    case "/remember": {
      if (!argText) {
        responseText = at(lang, "slash_remember_missing_arg");
      } else {
        const memory = await store.loadMemory();
        memory.notes.push(argText);
        memory.updatedAt = Date.now();
        await store.saveMemory(memory);
        responseText = at(lang, "slash_remember_done", argText);
      }
      break;
    }

    case "/forget": {
      await store.saveMemory({ enabled: settings.personalizationEnabled, notes: [], updatedAt: Date.now() });
      responseText = at(lang, "slash_forget_done");
      break;
    }

    case "/lessons": {
      const lessonsStore = await store.loadLessons();
      responseText = lessonsStore.lessons.length
        ? at(lang, "slash_lessons_list", lessonsStore.lessons.map((l) => `- ${l}`).join("\n"))
        : at(lang, "slash_lessons_empty");
      break;
    }

    case "/forget-lessons": {
      await store.saveLessons({ lessons: [], updatedAt: Date.now() });
      responseText = at(lang, "slash_forget_lessons_done");
      break;
    }

    case "/folders":
    case "/pwd": {
      const folders = session.folderPaths ?? [];
      responseText = folders.length
        ? at(lang, "slash_folders_list", folders.map((f) => `- ${f}`).join("\n"))
        : at(lang, "slash_folders_empty");
      break;
    }

    case "/mode": {
      responseText = at(lang, "slash_mode_current", session.mode);
      break;
    }

    case "/plan":
    case "/auto":
    case "/default": {
      const newMode = cmd.slice(1) as SessionSummary["mode"];
      await store.updateSession(sessionId, { mode: newMode });
      refreshSession = true;
      responseText = at(lang, "slash_mode_switched", newMode);
      break;
    }

    case "/rename": {
      if (!argText) {
        responseText = at(lang, "slash_rename_missing_arg");
      } else {
        const title = argText.slice(0, 80);
        await store.updateSession(sessionId, { title });
        refreshSession = true;
        responseText = at(lang, "slash_rename_done", title);
      }
      break;
    }

    case "/system": {
      responseText = settings.systemPrompt.trim()
        ? at(lang, "slash_system_prompt", settings.systemPrompt.trim())
        : at(lang, "slash_system_prompt_empty");
      break;
    }

    case "/whoami": {
      const provider = PROVIDERS[apiKey.providerId];
      responseText = at(
        lang,
        "slash_whoami",
        session.kind,
        provider?.displayName ?? apiKey.providerId,
        apiKey.model,
        session.mode,
        String((session.folderPaths ?? []).length)
      );
      break;
    }

    case "/export": {
      try {
        const messages = await store.loadMessages(sessionId);
        const lines = messages.map((m) => `## ${m.role}\n\n${m.content}`);
        const md = `# ${session.title || "Dertet Code chat"}\n\n${lines.join("\n\n")}\n`;
        const targetDir = session.folderPaths?.[0] || app.getPath("documents");
        const fileName = `dertet-chat-${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
        const filePath = path.join(targetDir, fileName);
        await fs.writeFile(filePath, md, "utf8");
        responseText = at(lang, "slash_export_done", filePath);
      } catch (e: any) {
        responseText = at(lang, "slash_export_failed", e?.message ?? String(e));
      }
      break;
    }

    case "/history": {
      const folder = session.folderPaths?.[0];
      const history = folder ? await readProjectHistory(folder) : null;
      responseText = history ? at(lang, "slash_history_body", history) : at(lang, "slash_history_empty");
      break;
    }

    case "/doctor": {
      const checks: string[] = [];
      checks.push(apiKey.apiKey?.trim() ? at(lang, "slash_doctor_key_ok") : at(lang, "slash_doctor_key_warn"));
      const folders = session.folderPaths ?? [];
      if (!folders.length) {
        checks.push(at(lang, "slash_doctor_no_folders"));
      } else {
        for (const f of folders) {
          try {
            await fs.access(f);
            checks.push(at(lang, "slash_doctor_folder_ok", f));
          } catch {
            checks.push(at(lang, "slash_doctor_folder_missing", f));
          }
        }
      }
      responseText = at(lang, "slash_doctor_header", checks.join("\n"));
      break;
    }

    case "/version": {
      responseText = at(lang, "slash_version", app.getVersion());
      break;
    }

    case "/bug": {
      responseText = at(lang, "slash_bug");
      break;
    }

    default:
      responseText = "";
  }

  const respMsg = newMessage(sessionId, "assistant", responseText);
  await store.appendMessage(sessionId, respMsg);
  agentEvents.emit("message_done", { sessionId, message: respMsg });
  if (refreshSession) agentEvents.emit("session_updated", { sessionId });
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
  const lang = settings.language;

  // A previous turn for this exact session might still be running (e.g. stuck in a retry wait) if the
  // UI's local "is this session busy" state ever gets out of sync with the real server-side state —
  // switching sessions and back recreates that state from scratch. Without this guard, calling runTurn()
  // again here would silently orphan the old run: two concurrent executions would both append messages
  // and emit events for the same session, racing each other and making the whole session look stuck.
  // So a new message always wins — abort whatever was still in flight and wait for it to actually stop
  // before touching this session's history.
  if (activeControllers.has(sessionId)) {
    activeControllers.get(sessionId)?.abort();
    const start = Date.now();
    while (activeControllers.has(sessionId) && Date.now() - start < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  if (isDertetCode && attachments.length === 0 && (await handleSlashCommand(sessionId, session, apiKey, client, userText, settings))) {
    return;
  }

  let plsFixMode = false;
  if (isDertetCode) {
    const plsFixMatch = userText.match(/^\s*\/plsfix\b\s*([\s\S]*)$/i);
    if (plsFixMatch) {
      plsFixMode = true;
      userText = plsFixMatch[1].trim() || "Investigate the project deeply and fix whatever is wrong, in the best available way.";
    }
  }

  const priorMessages = await store.loadMessages(sessionId);
  const isFirstMessage = priorMessages.length === 0;

  if (isFirstMessage && !session.title.trim()) {
    // Show the user's own words immediately instead of a generic "New session" placeholder — the
    // nicer LLM-generated title (further down, after the first reply completes) replaces this later.
    const placeholderTitle = userText.trim().slice(0, 60) || session.title;
    if (placeholderTitle) {
      await store.updateSession(sessionId, { title: placeholderTitle });
      agentEvents.emit("session_updated", { sessionId });
    }
  }

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
  const visitedPages: { url: string; title?: string }[] = [];

  try {
    let history = (await store.loadMessages(sessionId)).flatMap(toLlmMessages);
    let steps = 0;

    stepLoop: while (steps < MAX_AGENT_STEPS) {
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
        lessons: lessonsStore.lessons,
        plsFixMode
      });

      const assistantMsg = newMessage(sessionId, "assistant");
      let buffer = "";
      let thinkingBuffer = "";
      let toolCalls: ToolCallRecord[] = [];
      let streamError: string | null = null;
      let retryAttempt = 0;
      const retryLoopStartedAt = Date.now();

      for (;;) {
        buffer = "";
        thinkingBuffer = "";
        toolCalls = [];
        streamError = null;
        const thinkingActivity: AgentActivity = { kind: "thinking", label: at(lang, "activity_thinking"), detailKind: "none" };
        agentEvents.emit("activity", { sessionId, messageId: assistantMsg.id, activity: thinkingActivity });
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
              if (!buffer) agentEvents.emit("activity", { sessionId, messageId: assistantMsg.id, activity: null });
              buffer += event.text;
              agentEvents.emit("delta", { sessionId, messageId: assistantMsg.id, text: stripMarkersForDisplay(buffer) });
            } else if (event.type === "thinking_delta") {
              thinkingBuffer += event.text;
              agentEvents.emit("activity", {
                sessionId,
                messageId: assistantMsg.id,
                activity: { kind: "thinking", label: at(lang, "activity_thinking"), detailKind: "text", detailText: thinkingBuffer }
              });
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

        if (Date.now() - retryLoopStartedAt >= WATCHDOG_TIMEOUT_MS) {
          // Reconnecting hasn't helped for 15 straight minutes — stop silently retrying the identical
          // failed request and nudge the model forward with a synthetic continuation turn instead,
          // exactly as if the user had come back and said "keep going."
          const nudgeMsg = newMessage(sessionId, "user", WATCHDOG_NUDGE_TEXT);
          await store.appendMessage(sessionId, nudgeMsg);
          history.push({ role: "user", content: WATCHDOG_NUDGE_TEXT });
          agentEvents.emit("message_done", { sessionId, message: nudgeMsg });
          agentEvents.emit("retry_resolved", { sessionId });
          continue stepLoop;
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
        const answer = await requestChoice(sessionId, choice, controller);
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
          const answer = await requestChoice(sessionId, question, controller);
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
          const allowed = await requestComputerUsePermission(sessionId, controller);
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
          const approved = await requestToolApproval(sessionId, assistantMsg.id, call, controller);
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
        agentEvents.emit("activity", { sessionId, messageId: assistantMsg.id, activity: activityForToolCall(call, visitedPages, lang) });

        const result = await executeTool(
          { id: call.id, name: call.toolName, args: call.args },
          { folders: liveFolders, sessionId, ffmpegPath: settings.ffmpegPath }
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
      const limitMsg = newMessage(sessionId, "assistant", at(lang, "agent_step_limit_reached"));
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
