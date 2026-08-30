// Injected-JS payloads run inside a tab's page context via webContents.executeJavaScript(). Every
// payload is a self-contained IIFE returning only JSON-serializable values (Electron requires that
// for the result to cross back into the main process). String.raw keeps backslash sequences (regex
// escapes, \n) intact as literal source text instead of being interpreted by the TS template literal.

const ENUMERATE_HELPER = String.raw`
function __dertetVisible(el) {
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}
function __dertetEnumerate() {
  const sel = 'a, button, input, select, textarea, [role="button"], [role="link"], [role="textbox"]';
  return Array.from(document.querySelectorAll(sel)).filter(__dertetVisible);
}
function __dertetLabel(el) {
  const text = (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (text) return text;
  if (el.value) return String(el.value).slice(0, 80);
  const aria = el.getAttribute("aria-label");
  if (aria) return aria.slice(0, 80);
  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return placeholder.slice(0, 80);
  if (el.href) return el.href.slice(0, 80);
  return "";
}`;

export const READABLE_TEXT_JS = String.raw`(() => {
  try {
    if (!document.body) return { title: document.title || "", url: location.href, text: "" };
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, svg, nav, header, footer, aside, [aria-hidden="true"]').forEach((el) => el.remove());
    let root = clone.querySelector('article, main, [role="main"]');
    if (!root || (root.innerText || "").trim().length < 200) root = clone;
    const text = (root.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
    return { title: document.title || "", url: location.href, text };
  } catch (e) {
    return { title: document.title || "", url: location.href, text: "", error: String(e) };
  }
})()`;

export const LINKS_JS = String.raw`(() => {
  try {
    const seen = new Set();
    const out = [];
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = a.href;
      if (!href || href.startsWith("javascript:") || href === "#") continue;
      if (seen.has(href)) continue;
      seen.add(href);
      const text = (a.innerText || "").trim().replace(/\s+/g, " ").slice(0, 100);
      out.push(text ? (text + " | " + href) : href);
      if (out.length >= 200) break;
    }
    return { title: document.title || "", url: location.href, links: out };
  } catch (e) {
    return { title: document.title || "", url: location.href, links: [], error: String(e) };
  }
})()`;

export const INTERACTIVES_JS = String.raw`(() => {
  try {
    ${ENUMERATE_HELPER}
    const list = __dertetEnumerate();
    const out = list.map((el, i) => "#" + i + " " + el.tagName.toLowerCase() + ' "' + __dertetLabel(el) + '"');
    return { title: document.title || "", url: location.href, elements: out };
  } catch (e) {
    return { title: document.title || "", url: location.href, elements: [], error: String(e) };
  }
})()`;

export function findOnPageJs(query: string): string {
  const escaped = JSON.stringify(query);
  return String.raw`(() => {
    try {
      ${ENUMERATE_HELPER}
      const q = (${escaped}).toLowerCase();
      const bodyText = (document.body && document.body.innerText) || "";
      const idx = bodyText.toLowerCase().indexOf(q);
      const textMatch = idx >= 0 ? bodyText.slice(Math.max(0, idx - 150), idx + q.length + 150) : null;
      const list = __dertetEnumerate();
      const elementMatches = [];
      list.forEach((el, i) => {
        const label = __dertetLabel(el).toLowerCase();
        if (label.includes(q)) elementMatches.push("#" + i + " " + el.tagName.toLowerCase() + ' "' + __dertetLabel(el) + '"');
      });
      return { title: document.title || "", url: location.href, textMatch, elementMatches: elementMatches.slice(0, 30) };
    } catch (e) {
      return { title: document.title || "", url: location.href, textMatch: null, elementMatches: [], error: String(e) };
    }
  })()`;
}

export function clickElementJs(index: number): string {
  return String.raw`(() => {
    try {
      ${ENUMERATE_HELPER}
      const list = __dertetEnumerate();
      const el = list[${index}];
      if (!el) return { ok: false, error: "Елемент з таким індексом не знайдено (сторінка могла змінитися — прочитай елементи ще раз)." };
      el.scrollIntoView({ block: "center" });
      el.click();
      return { ok: true, tag: el.tagName.toLowerCase() };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  })()`;
}

export function typeIntoElementJs(index: number, text: string, submit: boolean): string {
  const escapedText = JSON.stringify(text);
  return String.raw`(() => {
    try {
      ${ENUMERATE_HELPER}
      const list = __dertetEnumerate();
      const el = list[${index}];
      if (!el) return { ok: false, error: "Елемент з таким індексом не знайдено (сторінка могла змінитися — прочитай елементи ще раз)." };
      el.scrollIntoView({ block: "center" });
      el.focus();
      const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value");
      if (nativeSetter && nativeSetter.set) nativeSetter.set.call(el, ${escapedText});
      else el.value = ${escapedText};
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      if (${submit ? "true" : "false"}) {
        const form = el.closest("form");
        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
        else el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  })()`;
}
