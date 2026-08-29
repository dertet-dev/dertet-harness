import * as fs from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import { ToolExecutionResult } from "../types";

const MAX_READ_CHARS = 200_000;

function resolveWithinFolders(folders: string[], targetPath: string): string {
  if (path.isAbsolute(targetPath)) return targetPath;
  if (folders.length === 0) return path.resolve(targetPath);
  if (folders.length === 1) return path.resolve(folders[0], targetPath);
  for (const folder of folders) {
    const candidate = path.resolve(folder, targetPath);
    if (existsSync(candidate)) return candidate;
  }
  return path.resolve(folders[0], targetPath);
}

export async function readFileTool(
  folders: string[],
  args: { path: string; startLine?: number; endLine?: number }
): Promise<ToolExecutionResult> {
  const full = resolveWithinFolders(folders, args.path);
  try {
    const raw = await fs.readFile(full, "utf-8");
    if (args.startLine || args.endLine) {
      const lines = raw.split("\n");
      const start = Math.max(1, args.startLine ?? 1) - 1;
      const end = Math.min(lines.length, args.endLine ?? lines.length);
      const slice = lines.slice(start, end).join("\n");
      return { ok: true, output: slice.length > MAX_READ_CHARS ? slice.slice(0, MAX_READ_CHARS) + "\n…(truncated)" : slice };
    }
    const output = raw.length > MAX_READ_CHARS ? raw.slice(0, MAX_READ_CHARS) + "\n…(truncated, file is longer)" : raw;
    return { ok: true, output };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося прочитати файл: ${e.message ?? e}` };
  }
}

export async function listDirTool(folders: string[], args: { path: string }): Promise<ToolExecutionResult> {
  const full = resolveWithinFolders(folders, args.path);
  try {
    const entries = await fs.readdir(full, { withFileTypes: true });
    const lines = entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
    return { ok: true, output: lines.length ? lines.join("\n") : "(порожньо)" };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося прочитати папку: ${e.message ?? e}` };
  }
}

export async function writeFileTool(
  folders: string[],
  args: { path: string; content: string }
): Promise<ToolExecutionResult> {
  const full = resolveWithinFolders(folders, args.path);
  let before = "";
  try {
    before = await fs.readFile(full, "utf-8");
  } catch {
    before = "";
  }
  try {
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, args.content, "utf-8");
    return {
      ok: true,
      output: `Файл записано: ${full}`,
      diff: { path: full, before, after: args.content }
    };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося записати файл: ${e.message ?? e}` };
  }
}

export async function editFileTool(
  folders: string[],
  args: { path: string; oldText: string; newText: string }
): Promise<ToolExecutionResult> {
  const full = resolveWithinFolders(folders, args.path);
  try {
    const before = await fs.readFile(full, "utf-8");
    const occurrences = before.split(args.oldText).length - 1;
    if (occurrences === 0) {
      return { ok: false, output: "oldText не знайдено у файлі — перевір точний текст (пробіли, відступи)." };
    }
    if (occurrences > 1) {
      return {
        ok: false,
        output: `oldText зустрічається ${occurrences} разів у файлі — додай більше контексту, щоб текст був унікальним.`
      };
    }
    const after = before.replace(args.oldText, args.newText);
    await fs.writeFile(full, after, "utf-8");
    return { ok: true, output: `Файл відредаговано: ${full}`, diff: { path: full, before, after } };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося відредагувати файл: ${e.message ?? e}` };
  }
}
