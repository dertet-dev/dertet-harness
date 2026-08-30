import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import * as path from "path";
import { randomUUID } from "crypto";
import * as store from "../agent/store";
import { fetchAvailableModels } from "../agent/llmClients/modelsApi";
import { providerList, PROVIDERS } from "../agent/providers";
import { agentEvents, runTurn, stopSession, approveToolCall, respondComputerUsePermission, respondChoice, isSessionActive } from "../agent/agentLoop";
import { ApiKeyEntry, Attachment, SessionKind } from "../agent/types";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#121016",
    frame: false,
    titleBarStyle: "hidden",
    show: false,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- window chrome controls (frameless window) ---
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximizeToggle", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle("window:close", () => mainWindow?.close());

// --- settings ---
ipcMain.handle("settings:get", () => store.loadSettings());
ipcMain.handle("settings:save", (_e, settings) => store.saveSettings(settings));
ipcMain.handle("settings:providers", () => providerList());
ipcMain.handle("settings:fetchModels", async (_e, providerId: string, baseUrl: string, apiKey: string) => {
  const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
  if (!provider) return [];
  return fetchAvailableModels(provider.apiStyle, baseUrl || provider.defaultBaseUrl, apiKey);
});
ipcMain.handle("settings:addApiKey", async (_e, entry: Omit<ApiKeyEntry, "id" | "createdAt">) => {
  const settings = await store.loadSettings();
  const newEntry: ApiKeyEntry = { ...entry, id: randomUUID(), createdAt: Date.now() };
  settings.apiKeys.push(newEntry);
  if (!settings.activeApiKeyId) settings.activeApiKeyId = newEntry.id;
  await store.saveSettings(settings);
  return newEntry;
});
ipcMain.handle("settings:updateApiKey", async (_e, id: string, patch: Partial<ApiKeyEntry>) => {
  const settings = await store.loadSettings();
  const idx = settings.apiKeys.findIndex((k) => k.id === id);
  if (idx >= 0) settings.apiKeys[idx] = { ...settings.apiKeys[idx], ...patch };
  await store.saveSettings(settings);
  return settings;
});
ipcMain.handle("settings:deleteApiKey", async (_e, id: string) => {
  const settings = await store.loadSettings();
  settings.apiKeys = settings.apiKeys.filter((k) => k.id !== id);
  if (settings.activeApiKeyId === id) settings.activeApiKeyId = settings.apiKeys[0]?.id ?? null;
  await store.saveSettings(settings);
  return settings;
});
ipcMain.handle("settings:setActiveApiKey", async (_e, id: string) => {
  const settings = await store.loadSettings();
  settings.activeApiKeyId = id;
  await store.saveSettings(settings);
  return settings;
});

// --- memory ---
ipcMain.handle("memory:get", () => store.loadMemory());
ipcMain.handle("memory:save", (_e, memory) => store.saveMemory(memory));

// --- sessions ---
ipcMain.handle("sessions:list", () => store.listSessions());
ipcMain.handle(
  "sessions:create",
  async (_e, kind: SessionKind, apiKeyId: string, folderPaths: string[], title: string) =>
    store.createSession(kind, apiKeyId, folderPaths, title)
);
ipcMain.handle("sessions:delete", (_e, id: string) => store.deleteSession(id));
ipcMain.handle("sessions:setMode", (_e, id: string, mode: string) => store.updateSession(id, { mode: mode as any }));
ipcMain.handle("sessions:addFolder", (_e, id: string, folder: string) => store.addFolderToSession(id, folder));
ipcMain.handle("sessions:removeFolder", (_e, id: string, folder: string) => store.removeFolderFromSession(id, folder));
ipcMain.handle("sessions:rename", (_e, id: string, title: string) => store.updateSession(id, { title }));
ipcMain.handle("sessions:messages", (_e, id: string) => store.loadMessages(id));
ipcMain.handle("sessions:deleteMessagesFrom", (_e, id: string, fromMessageId: string) =>
  store.deleteMessagesFrom(id, fromMessageId)
);

ipcMain.handle("fs:pickFolder", async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] });
  if (res.canceled || !res.filePaths.length) return null;
  return res.filePaths[0];
});
ipcMain.handle("fs:pickFiles", async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, { properties: ["openFile", "multiSelections"] });
  if (res.canceled) return null;
  return res.filePaths;
});

// --- chat / agent ---
ipcMain.handle("chat:send", (_e, sessionId: string, text: string, attachments: Attachment[]) => {
  runTurn(sessionId, text, attachments ?? []).catch((e) => {
    agentEvents.emit("error", { sessionId, message: e?.message ?? String(e) });
  });
});
ipcMain.handle("chat:stop", (_e, sessionId: string) => stopSession(sessionId));
ipcMain.handle("chat:approveToolCall", (_e, toolCallId: string, approved: boolean) =>
  approveToolCall(toolCallId, approved)
);
ipcMain.handle("chat:respondComputerUsePermission", (_e, requestId: string, allow: boolean, remember: boolean) =>
  respondComputerUsePermission(requestId, allow, remember)
);
ipcMain.handle("chat:respondChoice", (_e, requestId: string, answer: string) => respondChoice(requestId, answer));
ipcMain.handle("chat:isActive", (_e, sessionId: string) => isSessionActive(sessionId));

// forward agent events to renderer
const forwardedEvents = [
  "delta",
  "tool_call_update",
  "message_done",
  "session_idle",
  "error",
  "computer_use_permission_request",
  "choice_request",
  "session_updated",
  "retry",
  "retry_resolved"
];
for (const evt of forwardedEvents) {
  agentEvents.on(evt, (payload) => {
    // A turn can keep emitting events after the window starts closing (agentLoop's async work isn't
    // tied to window lifecycle) — sending on destroyed webContents throws, and since this runs inside
    // a plain EventEmitter callback, an uncaught throw here would break delivery to any other listener
    // still queued for this same event.
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send(`agent:${evt}`, payload);
    }
  });
}
