import { LlmClient, LlmMessage, LlmRequestOptions, LlmStreamEvent, LlmToolCall } from "./types";
import { parseSSE } from "./sse";
import { ToolDefinition } from "../types";

function buildContentBlocks(msg: LlmMessage): any {
  if (msg.role === "tool") {
    return [{ type: "tool_result", tool_use_id: msg.toolCallId, content: msg.content || "(no output)" }];
  }
  if (msg.role === "assistant" && msg.toolCalls?.length) {
    const blocks: any[] = [];
    if (msg.content) blocks.push({ type: "text", text: msg.content });
    for (const c of msg.toolCalls) {
      blocks.push({ type: "tool_use", id: c.id, name: c.name, input: c.args });
    }
    return blocks;
  }

  const images = (msg.attachments ?? []).filter((a) => a.kind === "image" && a.base64Data);
  const files = (msg.attachments ?? []).filter((a) => a.kind === "file" && a.textContent);
  let text = msg.content;
  for (const f of files) {
    text = `[Файл: ${f.fileName}]\n${f.textContent}\n\n${text}`;
  }
  if (images.length === 0) return text;
  return [
    ...images.map((img) => ({ type: "image", source: { type: "base64", media_type: img.mimeType, data: img.base64Data } })),
    { type: "text", text }
  ];
}

function buildMessages(messages: LlmMessage[]): any[] {
  return messages.map((msg) => ({
    role: msg.role === "tool" ? "user" : msg.role,
    content: buildContentBlocks(msg)
  }));
}

function buildTools(tools: ToolDefinition[]): any[] | undefined {
  if (!tools.length) return undefined;
  return tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }));
}

export const anthropicClient: LlmClient = {
  async *stream(opts: LlmRequestOptions): AsyncGenerator<LlmStreamEvent> {
    const body: any = {
      model: opts.model,
      max_tokens: 8192,
      stream: true,
      messages: buildMessages(opts.messages)
    };
    if (opts.systemPrompt.trim()) body.system = opts.systemPrompt;
    const tools = buildTools(opts.tools);
    if (tools) body.tools = tools;

    let response: Response;
    try {
      response = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": opts.apiKey,
          "anthropic-version": "2023-06-01"
        },
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

    const blocksByIndex = new Map<number, { type: string; id?: string; name?: string; jsonBuffer: string }>();
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

        switch (event.event) {
          case "content_block_start": {
            const block = json.content_block;
            blocksByIndex.set(json.index, {
              type: block?.type,
              id: block?.id,
              name: block?.name,
              jsonBuffer: ""
            });
            break;
          }
          case "content_block_delta": {
            const delta = json.delta;
            if (delta?.type === "text_delta" && typeof delta.text === "string") {
              gotAny = true;
              yield { type: "delta", text: delta.text };
            } else if (delta?.type === "input_json_delta" && typeof delta.partial_json === "string") {
              const entry = blocksByIndex.get(json.index);
              if (entry) entry.jsonBuffer += delta.partial_json;
            }
            break;
          }
          case "error": {
            yield { type: "error", message: json.error?.message ?? "API error" };
            break;
          }
          default:
            break;
        }
      }
    } catch (e: any) {
      if (!gotAny && blocksByIndex.size === 0) {
        yield { type: "error", message: e?.message ?? String(e) };
        return;
      }
    }

    for (const [, block] of blocksByIndex) {
      if (block.type !== "tool_use" || !block.name) continue;
      let args: Record<string, unknown> = {};
      try {
        args = block.jsonBuffer ? JSON.parse(block.jsonBuffer) : {};
      } catch {
        args = {};
      }
      const call: LlmToolCall = { id: block.id || `call_${Date.now()}`, name: block.name, args };
      yield { type: "tool_call", call };
    }

    yield { type: "done" };
  }
};
