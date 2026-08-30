import React from "react";
import { diffLines } from "diff";

export function DiffView({ path, before, after }: { path: string; before: string; after: string }) {
  const parts = diffLines(before, after);
  const lines: { text: string; type: "add" | "del" | "ctx" }[] = [];
  for (const part of parts) {
    const type = part.added ? "add" : part.removed ? "del" : "ctx";
    const partLines = part.value.replace(/\n$/, "").split("\n");
    for (const line of partLines) {
      lines.push({ text: (type === "add" ? "+ " : type === "del" ? "- " : "  ") + line, type });
    }
  }
  const trimmed = lines.length > 400 ? lines.slice(0, 400).concat([{ text: "…(обрізано)", type: "ctx" }]) : lines;

  return (
    <div className="diff-block">
      <div className="diff-header">{path}</div>
      <div className="diff-body">
        {trimmed.map((l, i) => (
          <div key={i} className={`diff-line ${l.type}`}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
