import React, { useMemo, useState } from "react";
import { useI18n } from "../i18n";

interface ModelPickerModalProps {
  providerName: string;
  models: string[];
  loading: boolean;
  currentValue: string;
  onSelect: (model: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function ModelPickerModal({ providerName, models, loading, currentValue, onSelect, onRefresh, onClose }: ModelPickerModalProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [models, query]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel model-picker" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t("model")} · {providerName}</div>
          <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
            {loading ? "…" : t("refresh")}
          </button>
        </div>
        <input
          className="field-input model-picker-search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("model_picker_search_placeholder", String(models.length))}
        />
        <div className="model-picker-count">{t("model_picker_count", String(filtered.length), String(models.length))}</div>
        <div className="model-picker-list">
          {filtered.length === 0 && !loading && <div className="sidebar-empty">{t("model_picker_none_found")}</div>}
          {filtered.map((m) => (
            <div
              key={m}
              className={`model-picker-item ${m === currentValue ? "selected" : ""}`}
              onClick={() => {
                onSelect(m);
                onClose();
              }}
            >
              {m}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
