import * as fs from "fs/promises";
import * as path from "path";
import { ToolExecutionResult } from "../types";

export function dertetCodeMdPath(folder: string): string {
  return path.join(folder, "DertetCode.md");
}

export async function readDertetCodeMd(folder: string): Promise<string | null> {
  try {
    return await fs.readFile(dertetCodeMdPath(folder), "utf-8");
  } catch {
    return null;
  }
}

export async function updateDertetCodeMdTool(
  folders: string[],
  args: { content: string }
): Promise<ToolExecutionResult> {
  const folder = folders[0];
  if (!folder) {
    return { ok: false, output: "Немає прив'язаної папки проєкту для цієї сесії." };
  }
  try {
    await fs.writeFile(dertetCodeMdPath(folder), args.content, "utf-8");
    return { ok: true, output: "DertetCode.md оновлено." };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося оновити DertetCode.md: ${e.message ?? e}` };
  }
}
