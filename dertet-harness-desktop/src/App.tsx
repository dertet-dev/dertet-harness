import React, { useEffect, useState } from "react";
import { SessionSummary, AgentMode, dertet } from "./api";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { ChatView } from "./components/ChatView";
import { DertetCodeView } from "./components/DertetCodeView";
import { SettingsView } from "./components/SettingsView";
import { I18nProvider, useI18n } from "./i18n";

type View = { kind: "session"; id: string } | { kind: "settings" };

export function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}

function AppInner() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [view, setView] = useState<View>({ kind: "settings" });

  async function refreshSessions() {
    const list = await dertet().sessions.list();
    setSessions(list);
    return list;
  }

  useEffect(() => {
    refreshSessions().then((list) => {
      if (list.length > 0) setView({ kind: "session", id: list[0].id });
    });
    const offUpdated = dertet().on.sessionUpdated(() => {
      refreshSessions();
    });
    return () => offUpdated();
  }, []);

  async function activeApiKeyId(): Promise<string | null> {
    const s = await dertet().settings.get();
    return s.activeApiKeyId;
  }

  async function onNewChat() {
    const keyId = await activeApiKeyId();
    const session = await dertet().sessions.create("chat", keyId ?? "", [], "");
    await refreshSessions();
    setView({ kind: "session", id: session.id });
  }

  async function onNewDertetCode() {
    const keyId = await activeApiKeyId();
    const session = await dertet().sessions.create("dertet_code", keyId ?? "", [], "");
    await refreshSessions();
    setView({ kind: "session", id: session.id });
  }

  async function onDeleteSession(id: string) {
    await dertet().sessions.delete(id);
    const list = await refreshSessions();
    if (view.kind === "session" && view.id === id) {
      setView(list.length ? { kind: "session", id: list[0].id } : { kind: "settings" });
    }
  }

  async function onRenameSession(sessionId: string, title: string) {
    await dertet().sessions.rename(sessionId, title);
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title } : s)));
  }

  async function onModeChange(sessionId: string, mode: AgentMode) {
    await dertet().sessions.setMode(sessionId, mode);
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, mode } : s)));
  }

  async function onAddFolder(sessionId: string, folder: string) {
    await dertet().sessions.addFolder(sessionId, folder);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId && !s.folderPaths.includes(folder) ? { ...s, folderPaths: [...s.folderPaths, folder] } : s))
    );
  }

  async function onRemoveFolder(sessionId: string, folder: string) {
    await dertet().sessions.removeFolder(sessionId, folder);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, folderPaths: s.folderPaths.filter((f) => f !== folder) } : s))
    );
  }

  const currentSession = view.kind === "session" ? sessions.find((s) => s.id === view.id) ?? null : null;

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-body">
        <Sidebar
          sessions={sessions}
          currentSessionId={view.kind === "session" ? view.id : null}
          onNewChat={onNewChat}
          onNewDertetCode={onNewDertetCode}
          onSelectSession={(id) => setView({ kind: "session", id })}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          onOpenSettings={() => setView({ kind: "settings" })}
        />
        <div className="main-content">
          {view.kind === "settings" && <SettingsView />}
          {view.kind === "session" && currentSession && currentSession.kind === "chat" && (
            <ChatView key={currentSession.id} session={currentSession} onOpenSettings={() => setView({ kind: "settings" })} />
          )}
          {view.kind === "session" && currentSession && currentSession.kind === "dertet_code" && (
            <DertetCodeView
              key={currentSession.id}
              session={currentSession}
              onModeChange={(mode) => onModeChange(currentSession.id, mode)}
              onAddFolder={(folder) => onAddFolder(currentSession.id, folder)}
              onRemoveFolder={(folder) => onRemoveFolder(currentSession.id, folder)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
