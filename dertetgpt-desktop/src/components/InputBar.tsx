import React, { useRef, useState } from "react";
import { Attachment, AgentMode, dertet } from "../api";
import { useI18n } from "../i18n";

const MODES: { id: AgentMode; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "plan", label: "Plan" },
  { id: "auto", label: "Auto" }
];

function readFileAsAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const isImage = file.type.startsWith("image/");
    reader.onload = () => {
      const result = reader.result as string;
      if (isImage) {
        const base64 = result.split(",")[1] ?? "";
        resolve({ fileName: file.name, mimeType: file.type || "image/png", kind: "image", base64Data: base64 });
      } else {
        resolve({ fileName: file.name, mimeType: file.type || "text/plain", kind: "file", textContent: result.slice(0, 60000) });
      }
    };
    if (isImage) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

export function InputBar({
  value,
  onChange,
  onSend,
  onStop,
  isSending,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  showModeSwitch,
  mode,
  onModeChange,
  showFolderOption,
  onPickFolder,
  folders,
  onRemoveFolder
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  isSending: boolean;
  attachments: Attachment[];
  onAddAttachment: (a: Attachment) => void;
  onRemoveAttachment: (i: number) => void;
  showModeSwitch: boolean;
  mode?: AgentMode;
  onModeChange?: (m: AgentMode) => void;
  showFolderOption: boolean;
  onPickFolder?: () => void;
  folders?: string[];
  onRemoveFolder?: (folder: string) => void;
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 || attachments.length > 0;

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const att = await readFileAsAttachment(file);
      onAddAttachment(att);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend && !isSending) onSend();
    }
  }

  return (
    <div className="input-bar-wrap">
      <div className="input-bar-inner">
        {attachments.length > 0 && (
          <div className="attachments-row">
            {attachments.map((a, i) => (
              <div className="attachment-chip" key={i}>
                <span>{a.fileName}</span>
                <button onClick={() => onRemoveAttachment(i)}>×</button>
              </div>
            ))}
          </div>
        )}
        <div className="input-row">
          <div style={{ position: "relative" }}>
            <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} title={t("attach")}>
              +
            </button>
            {menuOpen && (
              <div className="dialog" style={{ position: "absolute", bottom: 44, left: 0, width: 260, maxWidth: "80vw", padding: 6 }}>
                <button
                  className="sidebar-btn"
                  onClick={() => {
                    setMenuOpen(false);
                    imageInputRef.current?.click();
                  }}
                >
                  🖼️ {t("attach_photo")}
                </button>
                <button
                  className="sidebar-btn"
                  style={{ marginTop: 4 }}
                  onClick={() => {
                    setMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  📄 {t("attach_file")}
                </button>
                {showFolderOption && (
                  <button
                    className="sidebar-btn"
                    style={{ marginTop: 4 }}
                    onClick={() => {
                      setMenuOpen(false);
                      onPickFolder?.();
                    }}
                  >
                    📁 {t("attach_folder")}
                  </button>
                )}
                {showFolderOption && folders && folders.length > 0 && (
                  <div className="folder-strip">
                    <div className="folder-strip-title">{t("added_folders")}</div>
                    {folders.map((f) => {
                      const name = f.split(/[\\/]/).filter(Boolean).pop() ?? f;
                      return (
                        <div className="folder-strip-item" key={f}>
                          <button
                            className="folder-strip-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFolder?.(f);
                            }}
                            title={t("remove_folder_access")}
                          >
                            ×
                          </button>
                          <div className="folder-strip-text">
                            <div className="folder-strip-name">{name}</div>
                            <div className="folder-strip-path">{f}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
            <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          </div>

          {showModeSwitch && (
            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                style={{ width: "auto", borderRadius: 16, padding: "0 12px", fontSize: 12 }}
                onClick={() => setModeMenuOpen((v) => !v)}
              >
                {MODES.find((m) => m.id === mode)?.label ?? "Default"}
              </button>
              {modeMenuOpen && (
                <div className="dialog" style={{ position: "absolute", bottom: 44, left: 0, width: 140, padding: 6 }}>
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      className="sidebar-btn"
                      style={{ marginTop: 2 }}
                      onClick={() => {
                        setModeMenuOpen(false);
                        onModeChange?.(m.id);
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            className="input-textarea"
            rows={1}
            placeholder={t("message_placeholder")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className={`send-btn ${isSending ? "stop" : canSend ? "ready" : ""}`}
            onClick={() => (isSending ? onStop() : canSend && onSend())}
          >
            {isSending ? "■" : "↑"}
          </button>
        </div>
      </div>
    </div>
  );
}
