import { LlmClient, LlmMessage, LlmRequestOptions, LlmStreamEvent, LlmToolCall } from "./types";
import { parseSSE } from "./sse";
import { ToolDefinition } from "../types";

function buildContentParts(msg: LlmMessage): any {
  const images = (msg.attachments ?? []).filter((a) => a.kind === "image" && a.base64Data);
  const files = (msg.attachments ?? []).filter((a) => a.kind === "file" && a.textContent);
  let text = msg.content;
  for (const f of files) {
    text = `[Файл: ${f.fileName}]\n${f.textContent}\n\n${text}`;
  }
  if (images.length === 0) return text;
  return [
    { type: "text", text },
    ...images.map((img) => ({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` } }))
  ];
}

function buildMessages(systemPrompt: string, messages: LlmMessage[]): any[] {
  const out: any[] = [];
  if (systemPrompt.trim()) out.push({ role: "system", content: systemPrompt });
  for (const msg of messages) {
    if (msg.role === "tool") {
      out.push({ role: "tool", tool_call_id: msg.toolCallId, content: msg.content || "(no output)" });
    } else if (msg.role === "assistant" && msg.toolCalls?.length) {
      out.push({
        role: "assistant",
        content: msg.content || null,
        tool_calls: msg.toolCalls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: JSON.stringify(c.args) }
        }))
      });
    } else {
      out.push({ role: msg.role, content: buildContentParts(msg) });
    }
  }
  return out;
}

function buildTools(tools: ToolDefinition[]): any[] | undefined {
  if (!tools.length) return undefined;
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters }
  }));
}

export const openAiCompatibleClient: LlmClient = {
  async *stream(opts: LlmRequestOptions): AsyncGenerator<LlmStreamEvent> {
    const body: any = {
      model: opts.model,
      stream: true,
      messages: buildMessages(opts.systemPrompt, opts.messages)
    };
    const tools = buildTools(opts.tools);
    if (tools) {
      body.tools = tools;
      body.tool_choice = "auto";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`
    };
    if (opts.baseUrl.includes("openrouter.ai")) {
      headers["HTTP-Referer"] = "https://dertetgpt.app";
      headers["X-Title"] = "Dertet Harness Desktop";
    }

    let response: Response;
    try {
      response = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: opts.signal
      });
    } catch (e: any) {
      yield { type: "error", message: e?.message ?? String(e) };
      return;
    }

    if (!response.ok) {
      let text = "";
      try {
        text = await response.text();
      } catch {}
      yield { type: "error", message: text || `HTTP ${response.status}` };
      return;
    }

    const toolCallsByIndex = new Map<number, { id: string; name: string; argsBuffer: string }>();
    let gotAny = false;

    try {
      for await (const event of parseSSE(response)) {
        const data = event.data.trim();
        if (!data || data === "[DONE]") continue;
        let json: any;
        try {
          json = JSON.parse(data);
        } catch {
          continue;
        }
        if (json.error) {
          yield { type: "error", message: json.error.message ?? "API error" };
          continue;
        }
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;
        // Passive parsing only — never requested via a request-body flag, so this is a pure no-op on
        // providers that don't send it (native OpenAI). OpenRouter uses "reasoning"/"reasoning_details",
        // DeepSeek (and many vLLM-backed OpenAI-compatible hosts) use "reasoning_content".
        const reasoningText: string | undefined =
          typeof delta.reasoning === "string"
            ? delta.reasoning
            : typeof delta.reasoning_content === "string"
              ? delta.reasoning_content
              : Array.isArray(delta.reasoning_details)
                ? delta.reasoning_details.map((d: any) => d?.text ?? d?.summary ?? "").join("")
                : undefined;
        if (reasoningText) yield { type: "thinking_delta", text: reasoningText };
        if (typeof delta.content === "string" && delta.content.length) {
          gotAny = true;
          yield { type: "delta", text: delta.content };
        }
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            const existing = toolCallsByIndex.get(idx) ?? { id: "", name: "", argsBuffer: "" };
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (typeof tc.function?.arguments === "string") existing.argsBuffer += tc.function.arguments;
            toolCallsByIndex.set(idx, existing);
          }
        }
      }
    } catch (e: any) {
      if (!gotAny && toolCallsByIndex.size === 0) {
        yield { type: "error", message: e?.message ?? String(e) };
        return;
      }
    }

    for (const [, tc] of toolCallsByIndex) {
      if (!tc.name) continue;
      let args: Record<string, unknown> = {};
      try {
        args = tc.argsBuffer ? JSON.parse(tc.argsBuffer) : {};
      } catch {
        args = { _raw: tc.argsBuffer };
      }
      const call: LlmToolCall = { id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`, name: tc.name, args };
      yield { type: "tool_call", call };
    }

    yield { type: "done" };
  }
};
