"use client";

import { useEffect, useRef } from "react";

export type ConfirmDialogMode = "confirm" | "prompt";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  mode?: ConfirmDialogMode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  promptValue?: string;
  promptPlaceholder?: string;
  pending?: boolean;
  error?: string | null;
  onPromptChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Shared Y2K confirm / rename overlay (Sidebar-style chrome).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  mode = "confirm",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  promptValue = "",
  promptPlaceholder,
  pending = false,
  error = null,
  onPromptChange,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && mode === "prompt") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open, mode]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-sm border border-panel-border bg-panel shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-panel-border px-3 py-2">
          <p
            id="confirm-dialog-title"
            className="font-mono text-[10px] tracking-[0.18em] text-foreground uppercase"
          >
            {title}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            <span className="panel-screw" />
            <span className="panel-screw" />
          </div>
        </div>

        <div className="space-y-3 px-3 py-4">
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            {message}
          </p>

          {mode === "prompt" ? (
            <input
              ref={inputRef}
              type="text"
              value={promptValue}
              placeholder={promptPlaceholder}
              disabled={pending}
              onChange={(event) => onPromptChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onConfirm();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancel();
                }
              }}
              className="w-full rounded-sm border border-panel-border bg-panel-inset px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-accent"
            />
          ) : null}

          {error ? (
            <p className="font-mono text-[10px] text-[#c45c5c]">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="module-button rounded-sm border border-panel-border px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase disabled:opacity-40"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className="module-button rounded-sm border border-panel-border px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-foreground uppercase disabled:opacity-40"
              data-active={danger ? undefined : true}
              style={
                danger
                  ? { boxShadow: "inset 0 0 0 1px rgba(196, 92, 92, 0.45)" }
                  : undefined
              }
            >
              {pending ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
