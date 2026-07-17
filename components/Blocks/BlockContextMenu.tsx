"use client";

import { useEffect, useRef } from "react";

export type BlockContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  canRename: boolean;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function BlockContextMenu({
  open,
  x,
  y,
  canRename,
  onRename,
  onDelete,
  onClose,
}: BlockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[55] min-w-[9rem] rounded-sm border border-panel-border bg-panel-raised py-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      style={{ left: x, top: y }}
      role="menu"
    >
      {canRename ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:bg-panel-inset"
          onClick={() => {
            onRename();
            onClose();
          }}
        >
          Rename
        </button>
      ) : null}
      <button
        type="button"
        role="menuitem"
        className="block w-full px-3 py-2 text-left font-mono text-[10px] tracking-[0.12em] text-[#c45c5c] uppercase hover:bg-panel-inset"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
}
