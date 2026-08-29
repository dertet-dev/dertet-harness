import * as fs from "fs/promises";
import * as path from "path";

const HISTORY_FILE = "DertetCode-History.log";
const MAX_APPEND_CHARS = 6000;
const MAX_INJECT_CHARS = 8000;

function historyPath(folder: string): string {
  return path.join(folder, HISTORY_FILE);
}

/** Appends a compact record of one turn so any future session pointed at this same folder can pick up context. */
export async function appendProjectHistory(
  folder: string,
  sessionId: string,
  userText: string,
  assistantText: string
): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);
  const entry =
    `\n### ${stamp} (сесія ${sessionId.slice(0, 8)})\n` +
    `Користувач: ${clip(userText, MAX_APPEND_CHARS / 2)}\n` +
    `Агент: ${clip(assistantText, MAX_APPEND_CHARS / 2)}\n`;
  try {
    await fs.appendFile(historyPath(folder), entry, "utf-8");
  } catch {
    // best-effort — a folder that just became unreadable shouldn't break the turn
  }
}

/** Tail of the shared per-folder history, so a fresh session in the same folder inherits recent context. */
export async function readProjectHistory(folder: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(historyPath(folder), "utf-8");
    if (!raw.trim()) return null;
    return raw.length > MAX_INJECT_CHARS ? "…\n" + raw.slice(raw.length - MAX_INJECT_CHARS) : raw;
  } catch {
    return null;
  }
}
