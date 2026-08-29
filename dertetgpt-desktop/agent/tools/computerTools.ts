import { execFile } from "child_process";
import { desktopCapturer, screen } from "electron";
import { ToolExecutionResult } from "../types";

const PS_TIMEOUT_MS = 10_000;

function runPowerShell(script: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script],
      { timeout: PS_TIMEOUT_MS, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) reject(new Error(stderr || error.message));
        else resolve({ stdout, stderr });
      }
    );
  });
}

const WINFORMS_PRELUDE = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$signature = @'
[DllImport("user32.dll")]
public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
'@
Add-Type -MemberDefinition $signature -Name "Mouse" -Namespace "DertetHarness"
`;

const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;

export async function computerScreenshotTool(): Promise<ToolExecutionResult> {
  try {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const scaleFactor = display.scaleFactor || 1;
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: Math.round(width * scaleFactor), height: Math.round(height * scaleFactor) }
    });
    const primary = sources[0];
    if (!primary) return { ok: false, output: "Не вдалося отримати доступ до екрана." };
    const png = primary.thumbnail.toPNG();
    return {
      ok: true,
      output: `Скріншот зроблено (${width}x${height}).`,
      imageBase64: png.toString("base64"),
      imageMimeType: "image/png"
    };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося зробити скріншот: ${e.message ?? e}` };
  }
}

export async function computerMouseMoveTool(args: { x: number; y: number }): Promise<ToolExecutionResult> {
  try {
    await runPowerShell(
      `${WINFORMS_PRELUDE}\n[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(args.x)}, ${Math.round(args.y)})`
    );
    return { ok: true, output: `Курсор переміщено на (${args.x}, ${args.y}).` };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося перемістити курсор: ${e.message ?? e}` };
  }
}

export async function computerMouseClickTool(args: {
  x: number;
  y: number;
  button?: string;
}): Promise<ToolExecutionResult> {
  const button = (args.button ?? "left").toLowerCase();
  const clicks = button === "double" ? 2 : 1;
  const down = button === "right" ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_LEFTDOWN;
  const up = button === "right" ? MOUSEEVENTF_RIGHTUP : MOUSEEVENTF_LEFTUP;
  try {
    let script = `${WINFORMS_PRELUDE}\n[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(args.x)}, ${Math.round(args.y)})\nStart-Sleep -Milliseconds 60\n`;
    for (let i = 0; i < clicks; i++) {
      script += `[DertetHarness.Mouse]::mouse_event(${down}, 0, 0, 0, 0)\nStart-Sleep -Milliseconds 40\n[DertetHarness.Mouse]::mouse_event(${up}, 0, 0, 0, 0)\nStart-Sleep -Milliseconds 40\n`;
    }
    await runPowerShell(script);
    return { ok: true, output: `Клік (${button}) на (${args.x}, ${args.y}).` };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося клікнути: ${e.message ?? e}` };
  }
}

function escapeSendKeys(text: string): string {
  return text.replace(/([+^%~(){}[\]])/g, "{$1}");
}

export async function computerKeyTypeTool(args: { text: string }): Promise<ToolExecutionResult> {
  try {
    const escaped = escapeSendKeys(args.text).replace(/'/g, "''");
    await runPowerShell(
      `Add-Type -AssemblyName System.Windows.Forms\n[System.Windows.Forms.SendKeys]::SendWait('${escaped}')`
    );
    return { ok: true, output: `Введено текст (${args.text.length} символів).` };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося ввести текст: ${e.message ?? e}` };
  }
}

const NAMED_KEYS: Record<string, string> = {
  enter: "{ENTER}",
  esc: "{ESC}",
  escape: "{ESC}",
  tab: "{TAB}",
  space: " ",
  backspace: "{BACKSPACE}",
  delete: "{DELETE}",
  del: "{DELETE}",
  up: "{UP}",
  down: "{DOWN}",
  left: "{LEFT}",
  right: "{RIGHT}",
  home: "{HOME}",
  end: "{END}",
  pageup: "{PGUP}",
  pagedown: "{PGDN}",
  insert: "{INSERT}",
  f1: "{F1}", f2: "{F2}", f3: "{F3}", f4: "{F4}", f5: "{F5}", f6: "{F6}",
  f7: "{F7}", f8: "{F8}", f9: "{F9}", f10: "{F10}", f11: "{F11}", f12: "{F12}"
};

function keyComboToSendKeys(combo: string): string {
  const parts = combo.split("+").map((p) => p.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  let keyStr = NAMED_KEYS[key] ?? (key.length === 1 ? escapeSendKeys(key) : `{${key.toUpperCase()}}`);
  let prefix = "";
  if (modifiers.includes("ctrl") || modifiers.includes("control")) prefix += "^";
  if (modifiers.includes("alt")) prefix += "%";
  if (modifiers.includes("shift")) prefix += "+";
  return prefix ? `${prefix}(${keyStr})` : keyStr;
}

export async function computerKeyPressTool(args: { key: string }): Promise<ToolExecutionResult> {
  try {
    const sendKeysStr = keyComboToSendKeys(args.key).replace(/'/g, "''");
    await runPowerShell(
      `Add-Type -AssemblyName System.Windows.Forms\n[System.Windows.Forms.SendKeys]::SendWait('${sendKeysStr}')`
    );
    return { ok: true, output: `Натиснуто: ${args.key}` };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося натиснути клавішу: ${e.message ?? e}` };
  }
}
