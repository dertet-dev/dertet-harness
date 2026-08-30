import React, { useEffect, useState } from "react";
import { MessageRecord } from "../api";
import { renderRichText } from "./CodeBlock";
import { useI18n } from "../i18n";

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function MessageBubble({
  message,
  streamingText,
  onEdit
}: {
  message: MessageRecord;
  streamingText?: string;
  onEdit?: (message: MessageRecord) => void;
}) {
  const { t } = useI18n();
  const isUser = message.role === "user";
  const content = streamingText !== undefined ? streamingText : message.content;
  const isStreaming = streamingText !== undefined;
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menuPos) return;
    const close = () => setMenuPos(null);
    window.addEventListener("click", close);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("blur", close);
    };
  }, [menuPos]);

  function handleContextMenu(e: React.MouseEvent) {
    if (!isUser || isStreaming) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {message.attachments.map((a, i) =>
              a.kind === "image" && a.base64Data ? (
                <img
                  key={i}
                  src={`data:${a.mimeType};base64,${a.base64Data}`}
                  style={{ maxWidth: 140, maxHeight: 160, borderRadius: 10 }}
                />
              ) : (
                <div key={i} className="attachment-chip">
                  {a.fileName}
                </div>
              )
            )}
          </div>
        )}
        {(content || isStreaming) && (
          <div className={`msg-bubble ${message.isError ? "error" : ""}`} onContextMenu={handleContextMenu}>
            {content ? renderRichText(content) : "…"}
            {isStreaming && <div className="typing-dots">●●●</div>}
          </div>
        )}
        {!isUser && !isStreaming && content && (
          <button className="msg-copy-btn" onClick={() => navigator.clipboard.writeText(content)} title={t("copy")}>
            <CopyIcon />
          </button>
        )}
      </div>
      {menuPos && (
        <div className="context-menu" style={{ left: menuPos.x, top: menuPos.y }}>
          <button
            className="context-menu-item"
            onClick={() => {
              navigator.clipboard.writeText(content);
              setMenuPos(null);
            }}
          >
            {t("copy")}
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              onEdit?.(message);
              setMenuPos(null);
            }}
          >
            {t("edit")}
          </button>
        </div>
      )}
    </div>
  );
}
