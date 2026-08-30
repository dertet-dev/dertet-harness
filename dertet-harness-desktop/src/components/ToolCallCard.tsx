import React from "react";
import { ToolCallRecord } from "../api";
import { dertet } from "../api";
import { DiffView } from "./DiffView";
import { useI18n } from "../i18n";

const STATUS_KEYS: Record<ToolCallRecord["status"], string> = {
  pending_approval: "tool_status_pending_approval",
  denied: "tool_status_denied",
  running: "tool_status_running",
  done: "tool_status_done",
  error: "tool_status_error",
  timeout: "tool_status_timeout"
};

export function ToolCallCard({ call }: { call: ToolCallRecord }) {
  const { t } = useI18n();
  const argsText = Object.keys(call.args ?? {}).length ? JSON.stringify(call.args, null, 2) : null;

  return (
    <div className="tool-card">
      <div className="tool-card-head">
        <span className="tool-card-name">{call.toolName}</span>
        <span className={`tool-status ${call.status}`}>{t(STATUS_KEYS[call.status])}</span>
      </div>
      {argsText && <div className="tool-args">{argsText}</div>}
      {call.diff ? (
        <div style={{ marginTop: 8 }}>
          <DiffView path={call.diff.path} before={call.diff.before} after={call.diff.after} />
        </div>
      ) : (
        call.resultSummary && <div className="tool-result">{call.resultSummary}</div>
      )}
      {call.status === "pending_approval" && (
        <div className="tool-approve-row">
          <button className="btn btn-primary" onClick={() => dertet().chat.approveToolCall(call.id, true)}>
            {t("allow")}
          </button>
          <button className="btn btn-secondary" onClick={() => dertet().chat.approveToolCall(call.id, false)}>
            {t("deny")}
          </button>
        </div>
      )}
    </div>
  );
}
