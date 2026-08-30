import { ToolExecutionResult } from "../types";
import { getOrCreateTab, getTabIfExists, closeTab } from "../browser/browserPool";
import { READABLE_TEXT_JS, LINKS_JS, INTERACTIVES_JS, findOnPageJs, clickElementJs, typeIntoElementJs } from "../browser/extractors";

const DEFAULT_MAX_CHARS = 6_000;

function requireHttpUrl(raw: unknown): URL {
  const url = new URL(String(raw ?? ""));
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Дозволені лише http(s) URL.");
  }
  return url;
}

export async function browserOpenTool(
  sessionId: string,
  args: { url?: string; tabId?: string }
): Promise<ToolExecutionResult> {
  try {
    const url = requireHttpUrl(args.url);
    const tab = getOrCreateTab(sessionId, args.tabId || "main");
    await tab.win.loadURL(url.toString());
    const title = tab.win.isDestroyed() ? "" : tab.win.webContents.getTitle();
    return { ok: true, output: `Відкрито: ${title || url.toString()} (${url.toString()})` };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося відкрити сторінку в браузері: ${e?.message ?? e}` };
  }
}

export async function browserReadTool(
  sessionId: string,
  args: { tabId?: string; mode?: string; startChar?: number; maxChars?: number }
): Promise<ToolExecutionResult> {
  const tab = getTabIfExists(sessionId, args.tabId || "main");
  if (!tab) return { ok: false, output: "Вкладку браузера не знайдено — спочатку виклич browser_open." };
  const mode = args.mode || "text";
  try {
    if (mode === "links") {
      const result = await tab.win.webContents.executeJavaScript(LINKS_JS, true);
      const body = (result.links as string[]).join("\n");
      return { ok: true, output: `${result.title} (${result.url})\n\n${body || "(посилань не знайдено)"}` };
    }
    if (mode === "elements") {
      const result = await tab.win.webContents.executeJavaScript(INTERACTIVES_JS, true);
      const body = (result.elements as string[]).join("\n");
      return { ok: true, output: `${result.title} (${result.url})\n\n${body || "(інтерактивних елементів не знайдено)"}` };
    }
    const result = await tab.win.webContents.executeJavaScript(READABLE_TEXT_JS, true);
    const fullText = String(result.text || "");
    const start = Math.max(0, args.startChar ?? 0);
    const max = Math.min(args.maxChars ?? DEFAULT_MAX_CHARS, DEFAULT_MAX_CHARS);
    const slice = fullText.slice(start, start + max);
    const remaining = fullText.length - (start + slice.length);
    const suffix = remaining > 0 ? `\n\n[...ще ${remaining} символів — виклич знову з startChar=${start + slice.length}...]` : "";
    return { ok: true, output: `${result.title} (${result.url})\n\n${slice || "(порожня сторінка)"}${suffix}` };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося прочитати сторінку: ${e?.message ?? e}` };
  }
}

export async function browserFindTool(
  sessionId: string,
  args: { tabId?: string; query?: string }
): Promise<ToolExecutionResult> {
  const tab = getTabIfExists(sessionId, args.tabId || "main");
  if (!tab) return { ok: false, output: "Вкладку браузера не знайдено — спочатку виклич browser_open." };
  const query = String(args.query ?? "").trim();
  if (!query) return { ok: false, output: "Порожній запит для пошуку на сторінці." };
  try {
    const result = await tab.win.webContents.executeJavaScript(findOnPageJs(query), true);
    const parts: string[] = [];
    if (result.textMatch) parts.push(`Контекст у тексті:\n…${result.textMatch}…`);
    if (Array.isArray(result.elementMatches) && result.elementMatches.length) {
      parts.push(`Елементи, що збігаються:\n${result.elementMatches.join("\n")}`);
    }
    return { ok: true, output: parts.length ? parts.join("\n\n") : `Нічого не знайдено за запитом «${query}».` };
  } catch (e: any) {
    return { ok: false, output: `Пошук на сторінці не вдався: ${e?.message ?? e}` };
  }
}

export async function browserClickTool(
  sessionId: string,
  args: { tabId?: string; elementIndex?: number }
): Promise<ToolExecutionResult> {
  const tab = getTabIfExists(sessionId, args.tabId || "main");
  if (!tab) return { ok: false, output: "Вкладку браузера не знайдено — спочатку виклич browser_open." };
  const index = Number(args.elementIndex);
  if (!Number.isInteger(index) || index < 0) return { ok: false, output: "Некоректний elementIndex." };
  try {
    const result = await tab.win.webContents.executeJavaScript(clickElementJs(index), true);
    if (!result.ok) return { ok: false, output: result.error || "Клік не вдався." };
    return { ok: true, output: `Клікнув на елемент #${index} (${result.tag}).` };
  } catch (e: any) {
    return { ok: false, output: `Клік не вдався: ${e?.message ?? e}` };
  }
}

export async function browserTypeTool(
  sessionId: string,
  args: { tabId?: string; elementIndex?: number; text?: string; submit?: string }
): Promise<ToolExecutionResult> {
  const tab = getTabIfExists(sessionId, args.tabId || "main");
  if (!tab) return { ok: false, output: "Вкладку браузера не знайдено — спочатку виклич browser_open." };
  const index = Number(args.elementIndex);
  if (!Number.isInteger(index) || index < 0) return { ok: false, output: "Некоректний elementIndex." };
  const submit = String(args.submit ?? "false") === "true";
  try {
    const result = await tab.win.webContents.executeJavaScript(typeIntoElementJs(index, String(args.text ?? ""), submit), true);
    if (!result.ok) return { ok: false, output: result.error || "Введення тексту не вдалося." };
    return { ok: true, output: `Введено текст в елемент #${index}${submit ? " і надіслано" : ""}.` };
  } catch (e: any) {
    return { ok: false, output: `Введення тексту не вдалося: ${e?.message ?? e}` };
  }
}

export async function browserScreenshotTool(
  sessionId: string,
  args: { tabId?: string }
): Promise<ToolExecutionResult> {
  const tab = getTabIfExists(sessionId, args.tabId || "main");
  if (!tab) return { ok: false, output: "Вкладку браузера не знайдено — спочатку виклич browser_open." };
  try {
    const image = await tab.win.webContents.capturePage();
    const png = image.toPNG();
    return { ok: true, output: "Скріншот сторінки в браузері зроблено.", imageBase64: png.toString("base64"), imageMimeType: "image/png" };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося зробити скріншот сторінки: ${e?.message ?? e}` };
  }
}

export async function browserCloseTool(sessionId: string, args: { tabId?: string }): Promise<ToolExecutionResult> {
  const closed = closeTab(sessionId, args.tabId || "main");
  return { ok: true, output: closed ? "Вкладку браузера закрито." : "Вкладку браузера вже було закрито." };
}
