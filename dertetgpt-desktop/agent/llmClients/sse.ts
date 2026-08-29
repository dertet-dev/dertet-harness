import { Readable } from "stream";

export interface RawSSEEvent {
  event?: string;
  data: string;
}

export async function* parseSSE(response: Response): AsyncGenerator<RawSSEEvent> {
  if (!response.body) return;
  const nodeStream = Readable.fromWeb(response.body as any);
  let buffer = "";
  for await (const chunk of nodeStream) {
    buffer += Buffer.isBuffer(chunk) ? chunk.toString("utf-8") : String(chunk);
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let eventType: string | undefined;
      const dataLines: string[] = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length) yield { event: eventType, data: dataLines.join("\n") };
    }
  }
  if (buffer.trim()) {
    const dataLines = buffer
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim());
    if (dataLines.length) yield { data: dataLines.join("\n") };
  }
}
