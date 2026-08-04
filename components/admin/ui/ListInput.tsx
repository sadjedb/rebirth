"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/ui/Field";

export function ListInput({
  values,
  onChange,
  placeholder,
  addLabel = "Add",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      {values.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {values.map((value, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-admin-fg px-3 py-1.5 rounded-md bg-admin-surface">
                {value}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${value}`}
                className="text-admin-muted hover:text-admin-danger transition-colors px-1"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputClass()}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 px-3 py-2 text-sm rounded-md border border-admin-border text-admin-fg hover:bg-admin-surface-hover transition-colors"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
