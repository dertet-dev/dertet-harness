import React, { useEffect, useRef } from "react";
import { MessageRecord, SessionSummary } from "../api";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { ToolCallCard } from "./ToolCallCard";
import { useSessionChat } from "../hooks/useSessionChat";
import { useDraft } from "../hooks/useDraft";
import { ComputerUseDialog } from "./ComputerUseDialog";
import { ChoiceMenuBar } from "./ChoiceMenuBar";
import { useI18n } from "../i18n";

export function ChatView({ session, onOpenSettings }: { session: SessionSummary; onOpenSettings: () => void }) {
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDertetCode = session.kind === "dertet_code";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming, pendingSend]);

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

  return (
    <>
      <div className="messages-scroll" ref={scrollRef}>
        <div className="messages-inner">
          {messages.length === 0 && !streaming ? (
            <div className="empty-state">
              <div className="empty-state-title">{t("empty_chat_title")}</div>
              <div className="empty-state-sub" onClick={onOpenSettings} style={{ cursor: "pointer", userSelect: "auto" }}>
                {t("empty_chat_subtitle")}
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
                {isDertetCode && m.toolCalls?.map((c) => <ToolCallCard key={c.id} call={c} />)}
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
      {errorBanner && <div className="no-key-banner">⚠️ {errorBanner}</div>}
      {retryStatus && (
        <div className="no-key-banner retry-banner">
          ⏳ {t("retrying", String(Math.round(retryStatus.delayMs / 1000)), String(retryStatus.attempt))}
        </div>
      )}
      {editingMessageId && (
        <div className="editing-banner">
          {t("editing_message")}
          <button className="editing-cancel" onClick={clearDraft}>
            ×
          </button>
        </div>
      )}
      {choiceRequest && (
        <ChoiceMenuBar question={choiceRequest.question} onAnswer={answerChoice} onSkip={skipChoice} />
      )}
      <InputBar
        value={inputText}
        onChange={setInputText}
        onSend={handleSend}
        onStop={stop}
        isSending={isSending}
        attachments={attachments}
        onAddAttachment={(a) => setAttachments((prev) => [...prev, a])}
        onRemoveAttachment={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
        showModeSwitch={false}
        showFolderOption={false}
      />
      {computerUseRequestId && (
        <ComputerUseDialog requestId={computerUseRequestId} onClose={() => setComputerUseRequestId(null)} />
      )}
    </>
  );
}
