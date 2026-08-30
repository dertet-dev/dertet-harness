import React, { useEffect, useRef, useState } from "react";
import { AgentMode, MessageRecord, SessionSummary, dertet } from "../api";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { ToolCallCard } from "./ToolCallCard";
import { useSessionChat } from "../hooks/useSessionChat";
import { useDraft } from "../hooks/useDraft";
import { ComputerUseDialog } from "./ComputerUseDialog";
import { ChoiceMenuBar } from "./ChoiceMenuBar";
import { useI18n } from "../i18n";

export function DertetCodeView({
  session,
  onModeChange,
  onAddFolder,
  onRemoveFolder
}: {
  session: SessionSummary;
  onModeChange: (mode: AgentMode) => void;
  onAddFolder: (folder: string) => void;
  onRemoveFolder: (folder: string) => void;
}) {
  const { t } = useI18n();
  const {
    messages,
    streaming,
    pendingSend,
    errorBanner,
    isSending,
    retryStatus,
    send,
    stop,
    editFrom,
    computerUseRequestId,
    setComputerUseRequestId,
    choiceRequest,
    answerChoice,
    skipChoice
  } = useSessionChat(session.id);
  const { text: inputText, setText: setInputText, attachments, setAttachments, editingMessageId, setEditingMessageId, clear: clearDraft } =
    useDraft(session.id);
  const [tab, setTab] = useState<"chat" | "actions">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasFolder = session.folderPaths.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming, pendingSend, tab]);

  function handleSend() {
    if (editingMessageId) {
      editFrom(editingMessageId, inputText, attachments);
    } else {
      send(inputText, attachments);
    }
    clearDraft();
  }

  function handleEdit(message: MessageRecord) {
    setEditingMessageId(message.id);
    setInputText(message.content);
    setAttachments(message.attachments ?? []);
  }

  async function pickFolder() {
    const folder = await dertet().fs.pickFolder();
    if (folder) onAddFolder(folder);
  }

  const allToolCalls = messages.flatMap((m) => m.toolCalls ?? []);

  return (
    <>
      <div className="view-header">
        <div>
          <div className="view-header-title">{session.title || t("dertet_code")}</div>
          <div className="view-header-sub">
            {hasFolder ? session.folderPaths.join("  ·  ") : t("no_folder")}
          </div>
        </div>
        <div className="view-header-tabs">
          <button className={`tab-btn ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>
            Chat
          </button>
          <button className={`tab-btn ${tab === "actions" ? "active" : ""}`} onClick={() => setTab("actions")}>
            Actions
          </button>
        </div>
      </div>

      {tab === "chat" ? (
        <div className="messages-scroll" ref={scrollRef}>
          <div className="messages-inner">
            {messages.length === 0 && !streaming ? (
              <div className="empty-state">
                <div className="empty-state-title">Dertet Code</div>
                <div className="empty-state-sub">
                  {hasFolder ? t("dertetcode_empty_with_folder") : t("dertetcode_empty_no_folder")}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id}>
                  <MessageBubble
                    message={m}
                    streamingText={streaming?.messageId === m.id ? streaming.text : undefined}
                    onEdit={handleEdit}
                  />
                  {m.toolCalls?.map((c) => <ToolCallCard key={c.id} call={c} />)}
                </div>
              ))
            )}
            {streaming && !messages.some((m) => m.id === streaming.messageId) && (
              <MessageBubble
                message={{ id: streaming.messageId, sessionId: session.id, role: "assistant", content: "", createdAt: Date.now() }}
                streamingText={streaming.text}
              />
            )}
            {pendingSend && !streaming && (
              <MessageBubble
                message={{ id: "__pending__", sessionId: session.id, role: "assistant", content: "", createdAt: Date.now() }}
                streamingText=""
              />
            )}
          </div>
        </div>
      ) : (
        <div className="messages-scroll">
          <div className="messages-inner">
            {allToolCalls.length === 0 ? (
              <div className="actions-empty">{t("actions_empty")}</div>
            ) : (
              allToolCalls.map((c) => <ToolCallCard key={c.id} call={c} />)
            )}
          </div>
        </div>
      )}

      {errorBanner && <div className="no-key-banner">⚠️ {errorBanner}</div>}
      {retryStatus && (
        <div className="no-key-banner retry-banner">
          ⏳ {t("retrying", String(Math.round(retryStatus.delayMs / 1000)), String(retryStatus.attempt))}
        </div>
      )}
      {editingMessageId && tab === "chat" && (
        <div className="editing-banner">
          {t("editing_message")}
          <button className="editing-cancel" onClick={clearDraft}>
            ×
          </button>
        </div>
      )}
      {choiceRequest && tab === "chat" && (
        <ChoiceMenuBar question={choiceRequest.question} onAnswer={answerChoice} onSkip={skipChoice} />
      )}

      {tab === "chat" && (
        <InputBar
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
          onStop={stop}
          isSending={isSending}
          attachments={attachments}
          onAddAttachment={(a) => setAttachments((prev) => [...prev, a])}
          onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
          showModeSwitch
          mode={session.mode}
          onModeChange={onModeChange}
          showFolderOption
          onPickFolder={pickFolder}
          folders={session.folderPaths}
          onRemoveFolder={onRemoveFolder}
        />
      )}
      {computerUseRequestId && (
        <ComputerUseDialog requestId={computerUseRequestId} onClose={() => setComputerUseRequestId(null)} />
      )}
    </>
  );
}
