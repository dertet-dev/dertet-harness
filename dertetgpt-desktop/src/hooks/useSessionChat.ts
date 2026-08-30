import { useEffect, useState } from "react";
import { Attachment, AgentActivity, ChoiceQuestion, MessageRecord, dertet } from "../api";

export function useSessionChat(sessionId: string) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [streaming, setStreaming] = useState<{ messageId: string; text: string } | null>(null);
  const [activity, setActivity] = useState<AgentActivity | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [computerUseRequestId, setComputerUseRequestId] = useState<string | null>(null);
  const [pendingSend, setPendingSend] = useState(false);
  const [turnActive, setTurnActive] = useState(false);
  const [choiceRequest, setChoiceRequest] = useState<{ requestId: string; question: ChoiceQuestion } | null>(null);
  const [retryStatus, setRetryStatus] = useState<{ attempt: number; delayMs: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    dertet()
      .sessions.messages(sessionId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs);
      });
    // A turn started before this chat was last opened may still be running in the background (e.g. mid
    // retry-wait) — without this, reopening the chat would show "not sending" even though it actually is,
    // which is exactly what let a second message get sent on top of a still-running one.
    dertet()
      .chat.isActive(sessionId)
      .then((active) => {
        if (!cancelled && active) setTurnActive(true);
      });

    const offDelta = dertet().on.delta((p) => {
      if (p.sessionId !== sessionId) return;
      setPendingSend(false);
      setRetryStatus(null);
      setStreaming({ messageId: p.messageId, text: p.text });
    });
    const offActivity = dertet().on.activity((p) => {
      if (p.sessionId !== sessionId) return;
      setActivity(p.activity);
    });
    const offDone = dertet().on.messageDone((p) => {
      if (p.sessionId !== sessionId) return;
      // NOTE: does not clear turnActive/pendingSend — a multi-step Dertet Code turn can produce
      // several "message_done" events (one per tool-calling round) before the whole turn actually
      // finishes. Only session_idle/error mean the turn is truly over; clearing here would flip the
      // send/stop button back to "send" mid-turn while the agent is still working on a tool call.
      setStreaming(null);
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === p.message.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = p.message;
          return next;
        }
        return [...prev, p.message];
      });
    });
    const offToolUpdate = dertet().on.toolCallUpdate((p) => {
      if (p.sessionId !== sessionId) return;
      setPendingSend(false);
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === p.messageId);
        if (idx < 0) {
          return [
            ...prev,
            { id: p.messageId, sessionId, role: "assistant", content: "", toolCalls: [p.toolCall], createdAt: Date.now() }
          ];
        }
        const next = prev.slice();
        const msg = { ...next[idx] };
        const calls = msg.toolCalls ? msg.toolCalls.slice() : [];
        const callIdx = calls.findIndex((c) => c.id === p.toolCall.id);
        if (callIdx >= 0) calls[callIdx] = p.toolCall;
        else calls.push(p.toolCall);
        msg.toolCalls = calls;
        next[idx] = msg;
        return next;
      });
    });
    const offError = dertet().on.error((p) => {
      if (p.sessionId !== sessionId) return;
      setPendingSend(false);
      setTurnActive(false);
      setRetryStatus(null);
      setErrorBanner(p.message);
      setStreaming(null);
      setActivity(null);
    });
    const offIdle = dertet().on.sessionIdle((p) => {
      if (p.sessionId !== sessionId) return;
      setPendingSend(false);
      setTurnActive(false);
      setRetryStatus(null);
      setStreaming(null);
      setActivity(null);
    });
    const offComputerUse = dertet().on.computerUsePermissionRequest((p) => {
      if (p.sessionId !== sessionId) return;
      setComputerUseRequestId(p.requestId);
    });
    const offChoice = dertet().on.choiceRequest((p) => {
      if (p.sessionId !== sessionId) return;
      setPendingSend(false);
      setChoiceRequest({ requestId: p.requestId, question: p.question });
    });
    const offRetry = dertet().on.retry((p) => {
      if (p.sessionId !== sessionId) return;
      setPendingSend(false);
      setRetryStatus({ attempt: p.attempt, delayMs: p.delayMs, message: p.message });
    });
    const offRetryResolved = dertet().on.retryResolved((p) => {
      if (p.sessionId !== sessionId) return;
      setRetryStatus(null);
    });

    return () => {
      cancelled = true;
      offDelta();
      offActivity();
      offDone();
      offToolUpdate();
      offError();
      offIdle();
      offComputerUse();
      offChoice();
      offRetry();
      offRetryResolved();
    };
  }, [sessionId]);

  function send(text: string, attachments: Attachment[]) {
    if (!text.trim() && attachments.length === 0) return;
    setErrorBanner(null);
    setMessages((prev) => [
      ...prev,
      { id: `local_${Date.now()}`, sessionId, role: "user", content: text, attachments, createdAt: Date.now() }
    ]);
    setPendingSend(true);
    setTurnActive(true);
    setActivity(null);
    dertet().chat.send(sessionId, text, attachments);
  }

  function stop() {
    dertet().chat.stop(sessionId);
  }

  async function editFrom(messageId: string, text: string, attachments: Attachment[]) {
    await dertet().sessions.deleteMessagesFrom(sessionId, messageId);
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === messageId);
      return idx >= 0 ? prev.slice(0, idx) : prev;
    });
    send(text, attachments);
  }

  function answerChoice(answer: string) {
    if (!choiceRequest) return;
    dertet().chat.respondChoice(choiceRequest.requestId, answer);
    setChoiceRequest(null);
    setPendingSend(true);
  }

  function skipChoice() {
    answerChoice("(user skipped this question)");
  }

  const isSending = turnActive;

  return {
    messages,
    streaming,
    activity,
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
  };
}
