import React, { useEffect, useState } from "react";
import { ChoiceQuestion } from "../api";
import { useI18n } from "../i18n";

export function ChoiceMenuBar({
  question,
  onAnswer,
  onSkip
}: {
  question: ChoiceQuestion;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}) {
  const { t } = useI18n();
  const [customText, setCustomText] = useState("");
  const allowCustom = question.allowCustom !== false;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= question.options.length) {
        onAnswer(question.options[n - 1]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, onAnswer]);

  return (
    <div className="choice-menu">
      <div className="choice-menu-header">
        <div className="choice-menu-title">{question.question}</div>
        {question.page && question.totalPages && question.totalPages > 1 && (
          <div className="choice-menu-page">
            {question.page} {t("ask_choice_page")} {question.totalPages}
          </div>
        )}
        <button className="choice-menu-close" onClick={onSkip} title={t("ask_choice_skip")}>
          ×
        </button>
      </div>
      <div className="choice-menu-options">
        {question.options.map((opt, i) => (
          <button key={i} className="choice-menu-option" onClick={() => onAnswer(opt)}>
            <span className="choice-menu-num">{i + 1}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="choice-menu-custom">
          <span className="choice-menu-pencil">✎</span>
          <input
            className="choice-menu-custom-input"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={t("ask_choice_custom_placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customText.trim()) onAnswer(customText.trim());
            }}
          />
          <button
            className="btn btn-secondary choice-menu-skip"
            onClick={() => (customText.trim() ? onAnswer(customText.trim()) : onSkip())}
          >
            {customText.trim() ? "→" : t("ask_choice_skip")}
          </button>
        </div>
      )}
    </div>
  );
}
