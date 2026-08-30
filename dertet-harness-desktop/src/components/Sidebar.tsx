import React, { useEffect, useRef, useState } from "react";
import { SessionSummary } from "../api";
import { useI18n } from "../i18n";

export function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onNewDertetCode,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onOpenSettings
}: {
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onNewDertetCode: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onOpenSettings: () => void;
}) {
  const { t } = useI18n();
  const chats = sessions.filter((s) => s.kind === "chat");
  const dertetCodeSessions = sessions.filter((s) => s.kind === "dertet_code");

  return (
    <div className="sidebar">
      <div className="sidebar-brand">Dertet Harness</div>

      <button className="sidebar-btn accent" onClick={onNewChat}>
        ＋ {t("new_chat")}
      </button>

      <div className="sidebar-section-title">{t("chat_history")}</div>
      {chats.length === 0 && <div className="sidebar-empty">{t("no_chats_yet")}</div>}
      {chats.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          active={s.id === currentSessionId}
          onSelect={onSelectSession}
          onDelete={onDeleteSession}
          onRename={onRenameSession}
        />
      ))}

      <div className="sidebar-section-title">{t("dertet_code")}</div>
      <button className="sidebar-btn" onClick={onNewDertetCode}>
        ＋ {t("new_session")}
      </button>
      {dertetCodeSessions.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          active={s.id === currentSessionId}
          onSelect={onSelectSession}
          onDelete={onDeleteSession}
          onRename={onRenameSession}
        />
      ))}

      <div className="sidebar-bottom">
        <button className="sidebar-btn" onClick={onOpenSettings}>
          ⚙ {t("settings")}
        </button>
      </div>
    </div>
  );
}

function SessionRow({
  session,
  active,
  onSelect,
  onDelete,
  onRename
}: {
  session: SessionSummary;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const { t } = useI18n();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const fallbackTitle = session.kind === "dertet_code" ? t("new_session") : t("new_chat");

  useEffect(() => {
    if (!menuPos) return;
    const close = () => setMenuPos(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuPos]);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  function commitRename() {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== session.title) onRename(session.id, trimmed);
    setRenaming(false);
  }

  if (renaming) {
    return (
      <input
        ref={inputRef}
        className="sidebar-item-rename-input"
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitRename();
          if (e.key === "Escape") {
            setDraftTitle(session.title);
            setRenaming(false);
          }
        }}
      />
    );
  }

  return (
    <div
      className={`sidebar-item ${active ? "active" : ""}`}
      onClick={() => onSelect(session.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
      }}
    >
      <span className="sidebar-item-title">{session.title || fallbackTitle}</span>
      <button
        className="sidebar-item-del"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
      >
        ×
      </button>
      {menuPos && (
        <div className="context-menu" style={{ left: menuPos.x, top: menuPos.y }} onClick={(e) => e.stopPropagation()}>
          <button
            className="context-menu-item"
            onClick={() => {
              setDraftTitle(session.title || fallbackTitle);
              setRenaming(true);
              setMenuPos(null);
            }}
          >
            {t("rename")}
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              onDelete(session.id);
              setMenuPos(null);
            }}
          >
            {t("delete")}
          </button>
        </div>
      )}
    </div>
  );
}
