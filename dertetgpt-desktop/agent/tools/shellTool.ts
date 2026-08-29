import { exec } from "child_process";
import { ToolExecutionResult } from "../types";

const DEFAULT_TIMEOUT_SEC = 180;
const MAX_TIMEOUT_SEC = 300;
const MAX_OUTPUT_CHARS = 50_000;

export function runCommandTool(
  folders: string[],
  args: { command: string; cwd?: string; timeoutSeconds?: number }
): Promise<ToolExecutionResult> {
  const timeoutSec = Math.min(args.timeoutSeconds ?? DEFAULT_TIMEOUT_SEC, MAX_TIMEOUT_SEC);
  const cwd = args.cwd ?? folders[0] ?? process.cwd();

  return new Promise((resolve) => {
    const child = exec(
      args.command,
      { cwd, timeout: timeoutSec * 1000, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const truncate = (s: string) => (s.length > MAX_OUTPUT_CHARS ? s.slice(0, MAX_OUTPUT_CHARS) + "\n…(truncated)" : s);
        if (error && (error as any).killed) {
          resolve({
            ok: false,
            output: `Команда перевищила ліміт часу (${timeoutSec}с) і була зупинена.\n\nstdout:\n${truncate(stdout)}\n\nstderr:\n${truncate(stderr)}`
          });
          return;
        }
        const exitCode = error ? (error as any).code ?? 1 : 0;
        resolve({
          ok: !error,
          output: `exit code: ${exitCode}\n\nstdout:\n${truncate(stdout)}\n\nstderr:\n${truncate(stderr)}`
        });
      }
    );
    child.on("error", (e) => {
      resolve({ ok: false, output: `Не вдалося запустити команду: ${e.message}` });
    });
  });
}
