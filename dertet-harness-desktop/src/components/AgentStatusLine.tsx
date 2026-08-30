import React, { useState } from "react";
import { AgentActivity } from "../api";

export function AgentStatusLine({ activity }: { activity: AgentActivity }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = activity.detailKind !== "none" && (activity.detailText || activity.detailUrls?.length);

  return (
    <div className="msg-row assistant">
      <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div className="msg-bubble">
          <button
            className="agent-status-row"
            onClick={() => hasDetail && setExpanded((v) => !v)}
            style={{ cursor: hasDetail ? "pointer" : "default" }}
          >
            <span className="agent-status-label">{activity.label}</span>
            <span className="typing-dots">●●●</span>
            {hasDetail && <span className={`agent-status-chevron ${expanded ? "open" : ""}`}>▾</span>}
          </button>
          {expanded && hasDetail && (
            <div className="agent-status-detail">
              {activity.detailKind === "text" && <div className="agent-status-detail-text">{activity.detailText}</div>}
              {activity.detailKind === "urls" && (
                <div className="agent-status-detail-urls">
                  {activity.detailUrls?.map((u, i) => (
                    <div key={i} className="agent-status-detail-url">
                      {u.title && <div className="agent-status-detail-url-title">{u.title}</div>}
                      <div className="agent-status-detail-url-href">{u.url}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
