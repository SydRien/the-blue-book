"use client";

import type { ReactNode } from "react";

type ResizablePanelProps = {
  side: "left" | "right";
  width: number;
  collapsed: boolean;
  children: ReactNode;
  onCollapseToggle: () => void;
  collapseLabel?: string;
  expandLabel?: string;
};

export function ResizablePanel({
  side,
  width,
  collapsed,
  children,
  onCollapseToggle,
  collapseLabel = "Collapse panel",
  expandLabel = "Expand panel",
}: ResizablePanelProps) {
  const glyph =
    side === "left"
      ? collapsed
        ? "▶"
        : "◀"
      : collapsed
        ? "◀"
        : "▶";

  if (collapsed) {
    return (
      <div className="relative flex h-full w-0 shrink-0 overflow-visible">
        <button
          type="button"
          className={`module-button absolute top-1/2 z-20 -translate-y-1/2 rounded-sm border border-panel-border px-1 py-1.5 font-mono text-[9px] text-muted ${
            side === "left" ? "left-0" : "right-0"
          }`}
          title={expandLabel}
          aria-label={expandLabel}
          onClick={onCollapseToggle}
        >
          {glyph}
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full min-h-0 shrink-0 flex-col overflow-visible"
      style={{ width }}
    >
      <button
        type="button"
        className={`module-button absolute top-1/2 z-20 -translate-y-1/2 rounded-sm border border-panel-border px-1 py-1 font-mono text-[8px] text-muted ${
          side === "left"
            ? "right-0 translate-x-1/2"
            : "left-0 -translate-x-1/2"
        }`}
        title={collapseLabel}
        aria-label={collapseLabel}
        onClick={onCollapseToggle}
      >
        {glyph}
      </button>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
