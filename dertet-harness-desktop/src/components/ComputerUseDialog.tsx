import React from "react";
import { dertet } from "../api";
import { useI18n } from "../i18n";

export function ComputerUseDialog({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { t } = useI18n();
  function respond(allow: boolean, remember: boolean) {
    dertet().chat.respondComputerUsePermission(requestId, allow, remember);
    onClose();
  }

  return (
    <div className="overlay">
      <div className="dialog">
        <div className="dialog-title">🖥️ {t("computer_use_title")}</div>
        <div className="dialog-body">{t("computer_use_body")}</div>
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={() => respond(true, false)}>
            {t("computer_use_yes")}
          </button>
          <button className="btn btn-secondary" onClick={() => respond(true, true)}>
            {t("computer_use_yes_always")}
          </button>
          <button className="btn btn-danger" onClick={() => respond(false, false)}>
            {t("computer_use_no")}
          </button>
        </div>
      </div>
    </div>
  );
}
