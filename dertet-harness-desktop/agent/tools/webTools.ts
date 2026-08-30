import { ToolExecutionResult } from "../types";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_CHARS = 6_000;

function stripHtml(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DertetHarness-Desktop" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function webSearchTool(args: { query: string }): Promise<ToolExecutionResult> {
  const query = args.query.trim().slice(0, 300);
  if (!query) return { ok: false, output: "Порожній запит." };
  try {
    const html = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const text = stripHtml(html).slice(0, MAX_CHARS);
    return { ok: true, output: text || "Нічого не знайдено." };
  } catch (e: any) {
    return { ok: false, output: `Пошук не вдався: ${e.message ?? e}` };
  }
}

export async function webFetchTool(args: { url: string }): Promise<ToolExecutionResult> {
  try {
    const url = new URL(args.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, output: "Дозволені лише http(s) URL." };
    }
    const html = await fetchWithTimeout(url.toString());
    const text = stripHtml(html).slice(0, MAX_CHARS);
    return { ok: true, output: text || "(порожня сторінка)" };
  } catch (e: any) {
    return { ok: false, output: `Не вдалося завантажити сторінку: ${e.message ?? e}` };
  }
}
