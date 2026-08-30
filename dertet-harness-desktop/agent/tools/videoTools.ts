import * as fs from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { ToolExecutionResult } from "../types";
import { resolveFfmpegPath, resolveFfprobePath, runFfmpeg, tempVideoDir, ffmpegNotFoundMessage } from "./ffmpeg";

const RUN_TIMEOUT_MS = 30 * 60 * 1000; // long-form encodes (concat, slideshow) can legitimately take a while
const PROBE_TIMEOUT_MS = 15_000;

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

function friendlyFfmpegError(stderr: string): string {
  if (/ENOENT/i.test(stderr)) return ffmpegNotFoundMessage();
  return stderr.split("\n").slice(-15).join("\n");
}

function probeStreams(ffprobePath: string, filePath: string): Promise<any | null> {
  return new Promise((resolve) => {
    execFile(
      ffprobePath,
      ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", filePath],
      { timeout: PROBE_TIMEOUT_MS, windowsHide: true, maxBuffer: 5 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve(null);
        }
      }
    );
  });
}

export async function videoProbeTool(
  ffmpegConfiguredPath: string | undefined,
  folders: string[],
  args: { path: string }
): Promise<ToolExecutionResult> {
  const ffmpegPath = resolveFfmpegPath(ffmpegConfiguredPath);
  if (!ffmpegPath) return { ok: false, output: ffmpegNotFoundMessage() };
  const ffprobePath = resolveFfprobePath(ffmpegConfiguredPath);
  const full = resolveWithinFolders(folders, args.path);
  const data = await probeStreams(ffprobePath!, full);
  if (!data) return { ok: false, output: `Не вдалося прочитати медіафайл (ffprobe): ${full}` };
  const video = (data.streams ?? []).find((s: any) => s.codec_type === "video");
  const audio = (data.streams ?? []).find((s: any) => s.codec_type === "audio");
  const lines = [`Файл: ${full}`, `Тривалість: ${Number(data.format?.duration ?? 0).toFixed(1)}с`];
  if (video) {
    lines.push(`Відео: ${video.codec_name}, ${video.width}x${video.height}, ${video.r_frame_rate ?? "?"} fps`);
  }
  if (audio) {
    lines.push(`Аудіо: ${audio.codec_name}, ${audio.sample_rate ?? "?"} Hz, ${audio.channels ?? "?"} каналів`);
  }
  if (!video && !audio) lines.push("Відео- чи аудіодоріжок не знайдено.");
  return { ok: true, output: lines.join("\n") };
}

async function ensureOutputDir(outputPath: string): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
}

export async function videoAddAudioTool(
  ffmpegConfiguredPath: string | undefined,
  folders: string[],
  args: { videoPath: string; audioPath: string; outputPath: string; mode?: string }
): Promise<ToolExecutionResult> {
  const ffmpegPath = resolveFfmpegPath(ffmpegConfiguredPath);
  if (!ffmpegPath) return { ok: false, output: ffmpegNotFoundMessage() };
  const video = resolveWithinFolders(folders, args.videoPath);
  const audio = resolveWithinFolders(folders, args.audioPath);
  const output = resolveWithinFolders(folders, args.outputPath);
  const mode = args.mode ?? "replace";
  await ensureOutputDir(output);

  let cliArgs: string[];
  if (mode === "mix") {
    cliArgs = [
      "-y", "-i", video, "-i", audio,
      "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first[aout]",
      "-map", "0:v:0", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
      output
    ];
  } else if (mode === "keep_both") {
    cliArgs = [
      "-y", "-i", video, "-i", audio,
      "-map", "0:v:0", "-map", "0:a?", "-map", "1:a:0",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
      output
    ];
  } else {
    cliArgs = ["-y", "-i", video, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", output];
  }

  const result = await runFfmpeg(ffmpegPath, cliArgs, RUN_TIMEOUT_MS);
  if (!result.ok) return { ok: false, output: `Не вдалося додати аудіо: ${friendlyFfmpegError(result.stderr)}` };
  return { ok: true, output: `Готово: ${output}` };
}

export async function videoTrimTool(
  ffmpegConfiguredPath: string | undefined,
  folders: string[],
  args: { videoPath: string; startSeconds: number; endSeconds: number; outputPath: string }
): Promise<ToolExecutionResult> {
  const ffmpegPath = resolveFfmpegPath(ffmpegConfiguredPath);
  if (!ffmpegPath) return { ok: false, output: ffmpegNotFoundMessage() };
  const video = resolveWithinFolders(folders, args.videoPath);
  const output = resolveWithinFolders(folders, args.outputPath);
  const duration = Number(args.endSeconds) - Number(args.startSeconds);
  if (!(duration > 0)) return { ok: false, output: "endSeconds має бути більшим за startSeconds." };
  await ensureOutputDir(output);

  const result = await runFfmpeg(
    ffmpegPath,
    ["-y", "-ss", String(args.startSeconds), "-i", video, "-t", String(duration), "-c:v", "libx264", "-c:a", "aac", output],
    RUN_TIMEOUT_MS
  );
  if (!result.ok) return { ok: false, output: `Не вдалося обрізати відео: ${friendlyFfmpegError(result.stderr)}` };
  return { ok: true, output: `Готово: ${output}` };
}

export async function videoConcatTool(
  ffmpegConfiguredPath: string | undefined,
  folders: string[],
  args: { videoPaths: string[]; outputPath: string }
): Promise<ToolExecutionResult> {
  const ffmpegPath = resolveFfmpegPath(ffmpegConfiguredPath);
  if (!ffmpegPath) return { ok: false, output: ffmpegNotFoundMessage() };
  const clips = (args.videoPaths ?? []).map((p) => resolveWithinFolders(folders, p));
  if (clips.length < 2) return { ok: false, output: "Потрібно щонайменше 2 відео для склеювання." };
  const output = resolveWithinFolders(folders, args.outputPath);
  await ensureOutputDir(output);

  const ffprobePath = resolveFfprobePath(ffmpegConfiguredPath);
  const firstInfo = await probeStreams(ffprobePath!, clips[0]);
  const firstVideoStream = firstInfo?.streams?.find((s: any) => s.codec_type === "video");
  const width = firstVideoStream?.width ?? 1280;
  const height = firstVideoStream?.height ?? 720;

  // Clips from different sources almost never share codec/resolution/timebase — plain `-c copy`
  // concatenation silently breaks in that case, so every clip is normalized to the first clip's
  // resolution and re-encoded.
  const inputArgs = clips.flatMap((c) => ["-i", c]);
  const filterParts: string[] = [];
  const streamRefs: string[] = [];
  clips.forEach((_c, i) => {
    filterParts.push(
      `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}]`
    );
    filterParts.push(`[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo[a${i}]`);
    streamRefs.push(`[v${i}][a${i}]`);
  });
  const filterComplex = `${filterParts.join(";")};${streamRefs.join("")}concat=n=${clips.length}:v=1:a=1[outv][outa]`;

  const result = await runFfmpeg(
    ffmpegPath,
    [
      "-y", ...inputArgs,
      "-filter_complex", filterComplex,
      "-map", "[outv]", "-map", "[outa]",
      "-c:v", "libx264", "-c:a", "aac",
      output
    ],
    RUN_TIMEOUT_MS
  );
  if (!result.ok) return { ok: false, output: `Не вдалося склеїти відео: ${friendlyFfmpegError(result.stderr)}` };
  return { ok: true, output: `Готово: ${output}` };
}

export async function videoFromImagesTool(
  ffmpegConfiguredPath: string | undefined,
  folders: string[],
  args: { imagePaths: string[]; outputPath: string; secondsPerImage: number; audioPath?: string }
): Promise<ToolExecutionResult> {
  const ffmpegPath = resolveFfmpegPath(ffmpegConfiguredPath);
  if (!ffmpegPath) return { ok: false, output: ffmpegNotFoundMessage() };
  const images = (args.imagePaths ?? []).map((p) => resolveWithinFolders(folders, p));
  if (images.length === 0) return { ok: false, output: "Потрібне хоча б одне зображення." };
  const output = resolveWithinFolders(folders, args.outputPath);
  const perImage = Math.max(0.1, Number(args.secondsPerImage) || 2);
  await ensureOutputDir(output);

  const listPath = path.join(tempVideoDir(), `concat-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  const escapeForList = (p: string) => `'${p.replace(/'/g, "'\\''")}'`;
  // The concat demuxer ignores the final entry's own "duration" line, so the last image is
  // deliberately repeated once at the end to make it hold for its full duration too.
  const lines: string[] = [];
  for (const img of images) {
    lines.push(`file ${escapeForList(img)}`);
    lines.push(`duration ${perImage}`);
  }
  lines.push(`file ${escapeForList(images[images.length - 1])}`);
  await fs.writeFile(listPath, lines.join("\n"), "utf-8");

  const audio = args.audioPath ? resolveWithinFolders(folders, args.audioPath) : null;
  const cliArgs = [
    "-y", "-f", "concat", "-safe", "0", "-i", listPath,
    ...(audio ? ["-i", audio] : []),
    "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
    "-r", "30",
    ...(audio ? ["-c:a", "aac", "-shortest"] : []),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    output
  ];

  try {
    const result = await runFfmpeg(ffmpegPath, cliArgs, RUN_TIMEOUT_MS);
    if (!result.ok) return { ok: false, output: `Не вдалося зібрати відео з зображень: ${friendlyFfmpegError(result.stderr)}` };
    return { ok: true, output: `Готово: ${output}` };
  } finally {
    fs.unlink(listPath).catch(() => {});
  }
}
