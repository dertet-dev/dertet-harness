import React, { useEffect, useState } from "react";
import { ApiKeyEntry, ProviderDef, Settings, UserMemory, dertet } from "../api";
import { ModelPickerModal } from "./ModelPickerModal";
import { LANGUAGES, LANGUAGE_NAMES, useI18n } from "../i18n";

export function SettingsView() {
  const { t, lang, setLang } = useI18n();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [providers, setProviders] = useState<ProviderDef[]>([]);
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>("new");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftProviderId, setDraftProviderId] = useState<string>("openrouter");
  const [draftBaseUrl, setDraftBaseUrl] = useState("");
  const [draftApiKey, setDraftApiKey] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    dertet().settings.get().then(setSettings);
    dertet().settings.providers().then(setProviders);
    dertet().memory.get().then(setMemory);
  }, []);

  const draftProvider = providers.find((p) => p.id === draftProviderId);

  function resetDraft() {
    setEditingKeyId("new");
    setDraftLabel("");
    setDraftProviderId(providers[0]?.id ?? "openrouter");
    setDraftBaseUrl(providers[0]?.defaultBaseUrl ?? "");
    setDraftApiKey("");
    setDraftModel(providers[0]?.defaultModel ?? "");
    setModelOptions([]);
  }

  function editKey(key: ApiKeyEntry) {
    setEditingKeyId(key.id);
    setDraftLabel(key.label);
    setDraftProviderId(key.providerId);
    setDraftBaseUrl(key.baseUrl);
    setDraftApiKey(key.apiKey);
    setDraftModel(key.model);
    setModelOptions([]);
  }

  async function refreshModels() {
    if (!draftProvider) return;
    setModelsLoading(true);
    const models = await dertet().settings.fetchModels(draftProvider.id, draftBaseUrl || draftProvider.defaultBaseUrl, draftApiKey);
    setModelOptions(models.length ? models : draftProvider.knownModels);
    setModelsLoading(false);
  }

  function openModelPicker() {
    setPickerOpen(true);
    if (modelOptions.length === 0) refreshModels();
  }

  async function saveDraft() {
    if (!draftProvider || !settings) return;
    const entry = {
      providerId: draftProvider.id as any,
      label: draftLabel.trim() || draftProvider.displayName,
      apiKey: draftApiKey.trim(),
      baseUrl: (draftBaseUrl.trim() || draftProvider.defaultBaseUrl) as string,
      model: draftModel.trim() || draftProvider.defaultModel
    };
    let newSettings: Settings;
    if (editingKeyId && editingKeyId !== "new") {
      newSettings = await dertet().settings.updateApiKey(editingKeyId, entry);
    } else {
      const added = await dertet().settings.addApiKey(entry);
      newSettings = await dertet().settings.get();
      newSettings.activeApiKeyId = added.id;
      await dertet().settings.save(newSettings);
    }
    setSettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function deleteKey(id: string) {
    const newSettings = await dertet().settings.deleteApiKey(id);
    setSettings(newSettings);
    if (editingKeyId === id) resetDraft();
  }

  async function setActive(id: string) {
    const newSettings = await dertet().settings.setActiveApiKey(id);
    setSettings(newSettings);
  }

  async function updateSettingsField(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await dertet().settings.save(next);
  }

  async function togglePersonalization() {
    if (!settings) return;
    await updateSettingsField({ personalizationEnabled: !settings.personalizationEnabled });
  }

  async function deleteMemoryNote(idx: number) {
    if (!memory) return;
    const next = { ...memory, notes: memory.notes.filter((_, i) => i !== idx), updatedAt: Date.now() };
    setMemory(next);
    await dertet().memory.save(next);
  }

  async function clearMemory() {
    const next: UserMemory = { enabled: true, notes: [], updatedAt: Date.now() };
    setMemory(next);
    await dertet().memory.save(next);
  }

  if (!settings) return null;

  return (
    <div className="settings-scroll">
      <div className="settings-inner">
        <section>
          <div className="settings-section-title">{t("language")}</div>
          <select className="field-select" value={lang} onChange={(e) => setLang(e.target.value as any)}>
            <option value="system">{t("language_system")}</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_NAMES[l]}
              </option>
            ))}
          </select>
        </section>

        <section>
          <div className="settings-section-title">{t("settings_api_keys")}</div>
          <div className="key-list">
            {settings.apiKeys.map((k) => {
              const p = providers.find((pr) => pr.id === k.providerId);
              return (
                <div key={k.id} className="key-item" onClick={() => setActive(k.id)}>
                  <div className={`radio-dot ${settings.activeApiKeyId === k.id ? "checked" : ""}`} />
                  <div className="key-item-main">
                    <div className="key-item-label">{k.label}</div>
                    <div className="key-item-sub">
                      {p?.displayName ?? k.providerId} · {k.model}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      editKey(k);
                    }}
                  >
                    {t("edit")}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKey(k.id);
                    }}
                  >
                    {t("delete")}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-title">{editingKeyId === "new" ? t("new_key") : t("edit_key")}</div>

          <div className="field-row">
            <label className="field-label">{t("provider")}</label>
            <select
              className="field-select"
              value={draftProviderId}
              onChange={(e) => {
                setDraftProviderId(e.target.value);
                const p = providers.find((pr) => pr.id === e.target.value);
                setDraftBaseUrl(p?.defaultBaseUrl ?? "");
                setDraftModel(p?.defaultModel ?? "");
                setModelOptions([]);
              }}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <label className="field-label">{t("key_label")}</label>
            <input
              className="field-input"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder={t("key_label_placeholder")}
            />
          </div>

          {draftProvider?.editableBaseUrl && (
            <div className="field-row">
              <label className="field-label">{t("base_url")}</label>
              <input className="field-input" value={draftBaseUrl} onChange={(e) => setDraftBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
            </div>
          )}

          <div className="field-row">
            <label className="field-label">{t("api_key")}</label>
            <input
              className="field-input"
              type="password"
              value={draftApiKey}
              onChange={(e) => setDraftApiKey(e.target.value)}
              placeholder={t("api_key_placeholder")}
            />
          </div>

          <div className="field-row">
            <label className="field-label">{t("model")}</label>
            <button type="button" className="field-input model-picker-trigger" onClick={openModelPicker}>
              <span>{draftModel || draftProvider?.defaultModel || t("model")}</span>
              <span className="model-picker-trigger-hint">
                {modelsLoading ? "…" : `${(modelOptions.length ? modelOptions : draftProvider?.knownModels ?? []).length}`}
              </span>
            </button>
          </div>
          {pickerOpen && draftProvider && (
            <ModelPickerModal
              providerName={draftProvider.displayName}
              models={modelOptions.length ? modelOptions : draftProvider.knownModels}
              loading={modelsLoading}
              currentValue={draftModel}
              onSelect={(m) => setDraftModel(m)}
              onRefresh={refreshModels}
              onClose={() => setPickerOpen(false)}
            />
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={saveDraft}>
              {saved ? t("saved") : t("save_key")}
            </button>
            {editingKeyId !== "new" && (
              <button className="btn btn-secondary" onClick={resetDraft}>
                {t("cancel")}
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="settings-section-title">{t("system_prompt")}</div>
          <textarea
            className="field-textarea"
            value={settings.systemPrompt}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            onBlur={() => updateSettingsField({ systemPrompt: settings.systemPrompt })}
            placeholder={t("system_prompt_placeholder")}
          />
        </section>

        <section className="settings-card">
          <div className="toggle-row">
            <div>
              <div className="key-item-label">{t("personalization")}</div>
              <div className="key-item-sub">{t("personalization_sub")}</div>
            </div>
            <button className={`toggle ${settings.personalizationEnabled ? "on" : ""}`} onClick={togglePersonalization}>
              <div className="toggle-knob" />
            </button>
          </div>
        </section>

        {settings.personalizationEnabled && memory && (
          <section>
            <div className="settings-section-title">{t("memory")}</div>
            {memory.notes.length === 0 ? (
              <div className="sidebar-empty">{t("memory_empty")}</div>
            ) : (
              <div className="key-list">
                {memory.notes.map((n, i) => (
                  <div key={i} className="key-item" style={{ cursor: "default" }}>
                    <div className="key-item-main">
                      <div className="key-item-label" style={{ fontWeight: 400 }}>
                        {n}
                      </div>
                    </div>
                    <button className="btn btn-danger" onClick={() => deleteMemoryNote(i)}>
                      ×
                    </button>
                  </div>
                ))}
                <button className="btn btn-secondary" onClick={clearMemory}>
                  {t("clear_all")}
                </button>
              </div>
            )}
          </section>
        )}

        <section>
          <div className="settings-section-title">{t("computer_use_section")}</div>
          <select
            className="field-select"
            value={settings.computerUseAllowed}
            onChange={(e) => updateSettingsField({ computerUseAllowed: e.target.value as any })}
          >
            <option value="ask">{t("computer_use_ask")}</option>
            <option value="always">{t("computer_use_always")}</option>
            <option value="never">{t("computer_use_never")}</option>
          </select>
        </section>

        <section>
          <div className="settings-section-title">{t("settings_video_section")}</div>
          <input
            className="field-input"
            placeholder={t("settings_ffmpeg_path_placeholder")}
            value={settings.ffmpegPath ?? ""}
            onChange={(e) => updateSettingsField({ ffmpegPath: e.target.value })}
          />
          <div className="settings-hint">{t("settings_ffmpeg_hint")}</div>
        </section>
      </div>
    </div>
  );
}
