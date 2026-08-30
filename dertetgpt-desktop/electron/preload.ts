import { contextBridge, ipcRenderer } from "electron";

const invoke = (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args);

function on(channel: string, cb: (payload: any) => void): () => void {
  const listener = (_e: any, payload: any) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld("dertet", {
  window: {
    minimize: () => invoke("window:minimize"),
    maximizeToggle: () => invoke("window:maximizeToggle"),
    close: () => invoke("window:close")
  },
  settings: {
    get: () => invoke("settings:get"),
    save: (settings: any) => invoke("settings:save", settings),
    providers: () => invoke("settings:providers"),
    fetchModels: (providerId: string, baseUrl: string, apiKey: string) =>
      invoke("settings:fetchModels", providerId, baseUrl, apiKey),
    addApiKey: (entry: any) => invoke("settings:addApiKey", entry),
    updateApiKey: (id: string, patch: any) => invoke("settings:updateApiKey", id, patch),
    deleteApiKey: (id: string) => invoke("settings:deleteApiKey", id),
    setActiveApiKey: (id: string) => invoke("settings:setActiveApiKey", id)
  },
  memory: {
    get: () => invoke("memory:get"),
    save: (memory: any) => invoke("memory:save", memory)
  },
  sessions: {
    list: () => invoke("sessions:list"),
    create: (kind: string, apiKeyId: string, folderPaths: string[], title: string) =>
      invoke("sessions:create", kind, apiKeyId, folderPaths, title),
    delete: (id: string) => invoke("sessions:delete", id),
    setMode: (id: string, mode: string) => invoke("sessions:setMode", id, mode),
    addFolder: (id: string, folder: string) => invoke("sessions:addFolder", id, folder),
    removeFolder: (id: string, folder: string) => invoke("sessions:removeFolder", id, folder),
    rename: (id: string, title: string) => invoke("sessions:rename", id, title),
    messages: (id: string) => invoke("sessions:messages", id),
    deleteMessagesFrom: (id: string, fromMessageId: string) => invoke("sessions:deleteMessagesFrom", id, fromMessageId)
  },
  fs: {
    pickFolder: () => invoke("fs:pickFolder"),
    pickFiles: () => invoke("fs:pickFiles")
  },
  chat: {
    send: (sessionId: string, text: string, attachments: any[]) => invoke("chat:send", sessionId, text, attachments),
    stop: (sessionId: string) => invoke("chat:stop", sessionId),
    approveToolCall: (toolCallId: string, approved: boolean) => invoke("chat:approveToolCall", toolCallId, approved),
    respondComputerUsePermission: (requestId: string, allow: boolean, remember: boolean) =>
      invoke("chat:respondComputerUsePermission", requestId, allow, remember),
    respondChoice: (requestId: string, answer: string) => invoke("chat:respondChoice", requestId, answer),
    isActive: (sessionId: string) => invoke("chat:isActive", sessionId)
  },
  on: {
    delta: (cb: (p: any) => void) => on("agent:delta", cb),
    activity: (cb: (p: any) => void) => on("agent:activity", cb),
    toolCallUpdate: (cb: (p: any) => void) => on("agent:tool_call_update", cb),
    messageDone: (cb: (p: any) => void) => on("agent:message_done", cb),
    sessionIdle: (cb: (p: any) => void) => on("agent:session_idle", cb),
    error: (cb: (p: any) => void) => on("agent:error", cb),
    computerUsePermissionRequest: (cb: (p: any) => void) => on("agent:computer_use_permission_request", cb),
    choiceRequest: (cb: (p: any) => void) => on("agent:choice_request", cb),
    sessionUpdated: (cb: (p: any) => void) => on("agent:session_updated", cb),
    retry: (cb: (p: any) => void) => on("agent:retry", cb),
    retryResolved: (cb: (p: any) => void) => on("agent:retry_resolved", cb)
  }
});
