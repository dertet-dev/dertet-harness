import React, { useMemo, useState } from "react";

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
          <div className="modal-title">Модель · {providerName}</div>
          <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
            {loading ? "…" : "Оновити список"}
          </button>
        </div>
        <input
          className="field-input model-picker-search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Пошук серед ${models.length} моделей…`}
        />
        <div className="model-picker-count">{filtered.length} із {models.length} моделей</div>
        <div className="model-picker-list">
          {filtered.length === 0 && !loading && <div className="sidebar-empty">Нічого не знайдено</div>}
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
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
