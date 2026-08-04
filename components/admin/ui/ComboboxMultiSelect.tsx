"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OrganizationOption, OrganizationRefValue } from "@/app/admin/products/types";

type ComboboxMultiSelectProps = {
  options: OrganizationOption[];
  value: OrganizationRefValue[];
  onChange: (next: OrganizationRefValue[]) => void;
  multiple?: boolean;
  allowCreate?: boolean;
  placeholder?: string;
  "aria-label": string;
};

function labelFor(ref: OrganizationRefValue, options: OrganizationOption[]): string {
  if (ref.kind === "new") return ref.name;
  return options.find((o) => o.id === ref.id)?.label ?? "Unknown";
}

function refsEqual(a: OrganizationRefValue, b: OrganizationRefValue): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind === "existing" && b.kind === "existing"
    ? a.id === b.id
    : a.kind === "new" && b.kind === "new"
    ? a.name === b.name
    : false;
}

export function ComboboxMultiSelect({
  options,
  value,
  onChange,
  multiple = true,
  allowCreate = true,
  placeholder = "Select…",
  ...aria
}: ComboboxMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => !q || o.label.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = filteredOptions.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());
  const alreadySelected = value.some(
    (v) => v.kind === "new" && v.name.toLowerCase() === query.trim().toLowerCase()
  );
  const showCreateRow = allowCreate && query.trim().length > 0 && !exactMatch && !alreadySelected;

  const rowCount = filteredOptions.length + (showCreateRow ? 1 : 0);

  function isSelected(option: OrganizationOption) {
    return value.some((v) => v.kind === "existing" && v.id === option.id);
  }

  function selectExisting(option: OrganizationOption) {
    const ref: OrganizationRefValue = { kind: "existing", id: option.id };
    if (!multiple) {
      onChange([ref]);
      setOpen(false);
      return;
    }
    if (isSelected(option)) {
      onChange(value.filter((v) => !(v.kind === "existing" && v.id === option.id)));
    } else {
      onChange([...value, ref]);
    }
    setQuery("");
  }

  function createNew() {
    const name = query.trim();
    if (!name) return;
    const ref: OrganizationRefValue = { kind: "new", name };
    onChange(multiple ? [...value, ref] : [ref]);
    setQuery("");
    if (!multiple) setOpen(false);
  }

  function removeRef(ref: OrganizationRefValue) {
    onChange(value.filter((v) => !refsEqual(v, ref)));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, rowCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < filteredOptions.length) {
        selectExisting(filteredOptions[activeIndex]);
      } else if (showCreateRow) {
        createNew();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeRef(value[value.length - 1]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-9 px-2 py-1.5 rounded-md border border-admin-border bg-admin-bg focus-within:border-admin-accent transition-colors cursor-text"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {multiple &&
          value.map((ref) => (
            <span
              key={ref.kind === "existing" ? ref.id : `new:${ref.name}`}
              className="inline-flex items-center gap-1 rounded bg-admin-accent/10 text-admin-accent text-xs px-2 py-1"
            >
              {labelFor(ref, options)}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRef(ref);
                }}
                aria-label={`Remove ${labelFor(ref, options)}`}
                className="hover:opacity-70"
              >
                ×
              </button>
            </span>
          ))}
        <input
          ref={inputRef}
          value={!multiple && value[0] && !open ? labelFor(value[0], options) : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          aria-label={aria["aria-label"]}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-admin-fg outline-none py-0.5"
        />
      </div>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-admin-border bg-admin-surface shadow-lg py-1"
        >
          {filteredOptions.length === 0 && !showCreateRow && (
            <p className="px-3 py-2 text-sm text-admin-muted">No options found.</p>
          )}
          {filteredOptions.map((option, i) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={isSelected(option)}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => selectExisting(option)}
              className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm transition-colors ${
                i === activeIndex ? "bg-admin-accent/10 text-admin-accent" : "text-admin-fg"
              }`}
            >
              {option.label}
              {isSelected(option) && <span aria-hidden="true">✓</span>}
            </button>
          ))}
          {showCreateRow && (
            <button
              type="button"
              onMouseEnter={() => setActiveIndex(filteredOptions.length)}
              onClick={createNew}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                activeIndex === filteredOptions.length ? "bg-admin-accent/10 text-admin-accent" : "text-admin-fg"
              }`}
            >
              + Create &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
