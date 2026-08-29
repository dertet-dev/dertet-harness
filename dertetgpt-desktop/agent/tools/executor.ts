import { ToolCallRequest, ToolExecutionResult } from "../types";
import { readFileTool, listDirTool, writeFileTool, editFileTool } from "./fileTools";
import { runCommandTool } from "./shellTool";
import { webSearchTool, webFetchTool } from "./webTools";
import { updateDertetCodeMdTool } from "./dertetCodeMd";
import {
  computerScreenshotTool,
  computerMouseMoveTool,
  computerMouseClickTool,
  computerKeyTypeTool,
  computerKeyPressTool
} from "./computerTools";

const DEFAULT_TOOL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes hang protection, per-tool

function withTimeout(promise: Promise<ToolExecutionResult>, ms: number, toolName: string): Promise<ToolExecutionResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ ok: false, output: `Інструмент "${toolName}" перевищив ліміт часу (${Math.round(ms / 1000)}с) і був зупинений.` });
    }, ms);
    promise
      .then((r) => {
        clearTimeout(timer);
        resolve(r);
      })
      .catch((e) => {
        clearTimeout(timer);
        resolve({ ok: false, output: `Помилка інструмента "${toolName}": ${e?.message ?? e}` });
      });
  });
}

export async function executeTool(
  call: ToolCallRequest,
  ctx: { folders: string[] }
): Promise<ToolExecutionResult> {
  const args = call.args as any;
  const timeoutMs =
    call.name === "run_command"
      ? Math.min(args.timeoutSeconds ?? 180, 300) * 1000 + 5000
      : DEFAULT_TOOL_TIMEOUT_MS;

  const run = (): Promise<ToolExecutionResult> => {
    switch (call.name) {
      case "read_file":
        return readFileTool(ctx.folders, args);
      case "list_dir":
        return listDirTool(ctx.folders, args);
      case "write_file":
        return writeFileTool(ctx.folders, args);
      case "edit_file":
        return editFileTool(ctx.folders, args);
      case "run_command":
        return runCommandTool(ctx.folders, args);
      case "web_search":
        return webSearchTool(args);
      case "web_fetch":
        return webFetchTool(args);
      case "update_dertetcode_md":
        return updateDertetCodeMdTool(ctx.folders, args);
      case "computer_screenshot":
        return computerScreenshotTool();
      case "computer_mouse_move":
        return computerMouseMoveTool(args);
      case "computer_mouse_click":
        return computerMouseClickTool(args);
      case "computer_key_type":
        return computerKeyTypeTool(args);
      case "computer_key_press":
        return computerKeyPressTool(args);
      default:
        return Promise.resolve({ ok: false, output: `Невідомий інструмент: ${call.name}` });
    }
  };

  try {
    return await withTimeout(run(), timeoutMs, call.name);
  } catch (e: any) {
    return { ok: false, output: `Помилка інструмента "${call.name}": ${e?.message ?? e}` };
  }
}
