import { LlmClient, LlmMessage, LlmRequestOptions, LlmStreamEvent, LlmToolCall } from "./types";
import { parseSSE } from "./sse";
import { ToolDefinition } from "../types";

function buildParts(msg: LlmMessage): any[] {
  if (msg.role === "tool") {
    return [{ functionResponse: { name: msg.toolName, response: { content: msg.content || "(no output)" } } }];
  }
  const parts: any[] = [];
  if (msg.content) parts.push({ text: msg.content });
  if (msg.role === "assistant" && msg.toolCalls?.length) {
    for (const c of msg.toolCalls) parts.push({ functionCall: { name: c.name, args: c.args } });
    return parts;
  }
  const images = (msg.attachments ?? []).filter((a) => a.kind === "image" && a.base64Data);
  const files = (msg.attachments ?? []).filter((a) => a.kind === "file" && a.textContent);
  if (files.length) {
    const fileText = files.map((f) => `[Файл: ${f.fileName}]\n${f.textContent}`).join("\n\n");
    parts[0] = { text: `${fileText}\n\n${msg.content}` };
  }
  for (const img of images) {
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64Data } });
  }
  return parts;
}

function geminiRole(msg: LlmMessage): string {
  if (msg.role === "tool") return "function";
  if (msg.role === "assistant") return "model";
  return "user";
}

function buildContents(messages: LlmMessage[]): any[] {
  return messages.map((msg) => ({ role: geminiRole(msg), parts: buildParts(msg) }));
}

function buildTools(tools: ToolDefinition[]): any[] | undefined {
  if (!tools.length) return undefined;
  return [
    {
      functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }))
    }
  ];
}

export const geminiClient: LlmClient = {
  async *stream(opts: LlmRequestOptions): AsyncGenerator<LlmStreamEvent> {
    const body: any = { contents: buildContents(opts.messages) };
    if (opts.systemPrompt.trim()) {
      body.systemInstruction = { parts: [{ text: opts.systemPrompt }] };
    }
    const tools = buildTools(opts.tools);
    if (tools) body.tools = tools;

    const cleanModel = opts.model.replace(/^models\//, "");
    let response: Response;
    try {
      response = await fetch(
        `${opts.baseUrl.replace(/\/$/, "")}/models/${cleanModel}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": opts.apiKey },
          body: JSON.stringify(body),
          signal: opts.signal
        }
      );
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

    let gotAny = false;
    try {
      for await (const event of parseSSE(response)) {
        const data = event.data.trim();
        if (!data) continue;
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
        const parts = json.candidates?.[0]?.content?.parts;
        if (!Array.isArray(parts)) continue;
        for (const part of parts) {
          if (typeof part.text === "string" && part.text.length) {
            gotAny = true;
            // Passive parsing — never requested via generationConfig.thinkingConfig, so this only ever
            // fires on models that include thought parts by default (some 2.5+/3 reasoning models do).
            if (part.thought === true) {
              yield { type: "thinking_delta", text: part.text };
            } else {
              yield { type: "delta", text: part.text };
            }
          }
          if (part.functionCall?.name) {
            gotAny = true;
            const call: LlmToolCall = {
              id: `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              name: part.functionCall.name,
              args: part.functionCall.args ?? {}
            };
            yield { type: "tool_call", call };
          }
        }
      }
    } catch (e: any) {
      if (!gotAny) {
        yield { type: "error", message: e?.message ?? String(e) };
        return;
      }
    }

    yield { type: "done" };
  }
};
