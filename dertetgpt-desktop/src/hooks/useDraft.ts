import { useState } from "react";
import { Attachment } from "../api";

interface Draft {
  text: string;
  attachments: Attachment[];
  editingMessageId: string | null;
}

const EMPTY_DRAFT: Draft = { text: "", attachments: [], editingMessageId: null };

// Module-level (not React state) so a draft survives the component unmounting — switching to a
// different session or to Settings fully unmounts ChatView/DertetCodeView, which would otherwise
// wipe an in-progress unsent message the moment the user navigates away and back.
const draftStore = new Map<string, Draft>();

export function useDraft(sessionId: string) {
  const initial = draftStore.get(sessionId) ?? EMPTY_DRAFT;
  const [text, setTextState] = useState(initial.text);
  const [attachments, setAttachmentsState] = useState<Attachment[]>(initial.attachments);
  const [editingMessageId, setEditingMessageIdState] = useState<string | null>(initial.editingMessageId);

  function persist(patch: Partial<Draft>) {
    const current = draftStore.get(sessionId) ?? EMPTY_DRAFT;
    draftStore.set(sessionId, { ...current, ...patch });
  }

  function setText(v: string) {
    setTextState(v);
    persist({ text: v });
  }

  function setAttachments(updater: Attachment[] | ((prev: Attachment[]) => Attachment[])) {
    setAttachmentsState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: Attachment[]) => Attachment[])(prev) : updater;
      persist({ attachments: next });
      return next;
    });
  }

  function setEditingMessageId(v: string | null) {
    setEditingMessageIdState(v);
    persist({ editingMessageId: v });
  }

  function clear() {
    setTextState("");
    setAttachmentsState([]);
    setEditingMessageIdState(null);
    draftStore.delete(sessionId);
  }

  return { text, setText, attachments, setAttachments, editingMessageId, setEditingMessageId, clear };
}
