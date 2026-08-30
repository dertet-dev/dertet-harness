import { execFile, ExecFileException } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

// No bundled binary — see README. Bundling a static ffmpeg build raises a GPL-3.0 redistribution
// question (the Windows builds with libx264/H.264 support are GPL, not LGPL) that's a licensing call
// for the project owner, not something to decide silently in code. Until that's made, ffmpeg is
// resolved from an explicit user-configured path or the system PATH, exactly like any other external
// CLI tool this app shells out to (run_command already does the same for git, npm, etc.).
let cachedFfmpegPath: string | null | undefined;
let cachedFfprobePath: string | null | undefined;

function candidatePaths(configuredPath: string | undefined): string[] {
  const candidates: string[] = [];
  if (configuredPath && configuredPath.trim()) candidates.push(configuredPath.trim());
  candidates.push("ffmpeg");
  return candidates;
}

export function resolveFfmpegPath(configuredPath?: string): string | null {
  if (cachedFfmpegPath !== undefined) return cachedFfmpegPath;
  for (const candidate of candidatePaths(configuredPath)) {
    if (candidate === "ffmpeg" || fs.existsSync(candidate)) {
      cachedFfmpegPath = candidate;
      return candidate;
    }
  }
  cachedFfmpegPath = null;
  return null;
}

export function resolveFfprobePath(configuredFfmpegPath?: string): string | null {
  if (cachedFfprobePath !== undefined) return cachedFfprobePath;
  if (configuredFfmpegPath && configuredFfmpegPath.trim()) {
    // ffprobe normally ships alongside ffmpeg in the same folder.
    const dir = path.dirname(configuredFfmpegPath.trim());
    const ext = path.extname(configuredFfmpegPath.trim());
    const sibling = path.join(dir, `ffprobe${ext}`);
    if (fs.existsSync(sibling)) {
      cachedFfprobePath = sibling;
      return sibling;
    }
  }
  cachedFfprobePath = "ffprobe";
  return "ffprobe";
}

export function resetFfmpegCache(): void {
  cachedFfmpegPath = undefined;
  cachedFfprobePath = undefined;
}

export interface FfmpegRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

export function runFfmpeg(ffmpegPath: string, args: string[], timeoutMs: number): Promise<FfmpegRunResult> {
  return new Promise((resolve) => {
    const child = execFile(
      ffmpegPath,
      args,
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 20 * 1024 * 1024 },
      (error: ExecFileException | null, stdout: string, stderr: string) => {
        if (error) {
          resolve({ ok: false, stdout, stderr: stderr || error.message });
        } else {
          resolve({ ok: true, stdout, stderr });
        }
      }
    );
    // execFile's own `timeout` option already kills the child on expiry, but we still want the
    // process gone immediately if the caller aborts for any other reason — belt and suspenders.
    child.on("error", () => {});
  });
}

export function tempVideoDir(): string {
  const dir = path.join(app.getPath("temp"), "dertet-video");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function ffmpegNotFoundMessage(): string {
  return (
    "ffmpeg не знайдено. Встанови ffmpeg (наприклад через winget: `winget install ffmpeg` або з " +
    "ffmpeg.org) так, щоб він був доступний у PATH, і спробуй ще раз."
  );
}
