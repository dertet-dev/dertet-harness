import { BrowserWindow, session as electronSession } from "electron";

interface VisitEntry {
  url: string;
  title: string;
  httpStatus: number;
  at: number;
}

interface Tab {
  win: BrowserWindow;
  visitLog: VisitEntry[];
  lastUsedAt: number;
}

// Bounds on the hidden-Chromium-renderer footprint each browsing tab costs (~80-150MB apiece) — a
// runaway agent turn opening tabs in a loop must not be able to exhaust system memory.
const MAX_TABS_PER_SESSION = 3;
const IDLE_TTL_MS = 10 * 60 * 1000;

const tabs = new Map<string, Tab>(); // key: `${sessionId}::${tabId}`
const hardenedPartitions = new Set<string>();

function tabKey(sessionId: string, tabId: string): string {
  return `${sessionId}::${tabId}`;
}

function hardenPartition(partitionName: string): void {
  if (hardenedPartitions.has(partitionName)) return;
  hardenedPartitions.add(partitionName);
  const ses = electronSession.fromPartition(partitionName);
  // The agent-driven tab never needs camera/mic/location/notifications/clipboard access, and must
  // never silently save a file to disk — a prompt-injected page could otherwise abuse any of these.
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.on("will-download", (event) => event.preventDefault());
}

function destroyTab(key: string): boolean {
  const tab = tabs.get(key);
  if (!tab) return false;
  tabs.delete(key);
  if (!tab.win.isDestroyed()) tab.win.destroy();
  return true;
}

export function getOrCreateTab(sessionId: string, tabId: string): Tab {
  const key = tabKey(sessionId, tabId);
  const existing = tabs.get(key);
  if (existing && !existing.win.isDestroyed()) {
    existing.lastUsedAt = Date.now();
    return existing;
  }

  const sessionTabKeys = [...tabs.keys()].filter((k) => k.startsWith(`${sessionId}::`));
  if (sessionTabKeys.length >= MAX_TABS_PER_SESSION) {
    let oldestKey = sessionTabKeys[0];
    let oldestTime = tabs.get(oldestKey)!.lastUsedAt;
    for (const k of sessionTabKeys) {
      const t = tabs.get(k)!;
      if (t.lastUsedAt < oldestTime) {
        oldestTime = t.lastUsedAt;
        oldestKey = k;
      }
    }
    destroyTab(oldestKey);
  }

  // In-memory (not "persist:"-prefixed) partition scoped to this chat session — cookies/storage
  // survive across messages within the same session so a login or multi-step flow keeps working,
  // but never touch disk and never leak between different sessions.
  const partitionName = `dertet-browser-${sessionId}`;
  hardenPartition(partitionName);

  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: {
      partition: partitionName,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false
    }
  });

  const tab: Tab = { win, visitLog: [], lastUsedAt: Date.now() };

  win.webContents.setWindowOpenHandler(({ url }) => {
    tab.visitLog.push({ url, title: "", httpStatus: 0, at: Date.now() });
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!/^https?:/i.test(url)) event.preventDefault();
  });
  win.webContents.on("did-navigate", (_event, url, httpStatus) => {
    tab.visitLog.push({ url, title: win.isDestroyed() ? "" : win.webContents.getTitle(), httpStatus, at: Date.now() });
  });
  win.webContents.on("did-navigate-in-page", (_event, url) => {
    tab.visitLog.push({ url, title: win.isDestroyed() ? "" : win.webContents.getTitle(), httpStatus: 200, at: Date.now() });
  });

  tabs.set(key, tab);
  return tab;
}

export function getTabIfExists(sessionId: string, tabId: string): Tab | undefined {
  const tab = tabs.get(tabKey(sessionId, tabId));
  if (tab && !tab.win.isDestroyed()) {
    tab.lastUsedAt = Date.now();
    return tab;
  }
  return undefined;
}

export function closeTab(sessionId: string, tabId: string): boolean {
  return destroyTab(tabKey(sessionId, tabId));
}

export function destroyAllForSession(sessionId: string): void {
  for (const key of [...tabs.keys()]) {
    if (key.startsWith(`${sessionId}::`)) destroyTab(key);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, tab] of tabs) {
    if (now - tab.lastUsedAt > IDLE_TTL_MS) destroyTab(key);
  }
}, 60_000).unref();
