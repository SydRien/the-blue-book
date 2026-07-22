"use client";

import { useEffect, useRef } from "react";

type VerticalResizeDividerProps = {
  /** Called with vertical delta from last pointer position (positive = down). */
  onDragDelta: (dy: number) => void;
  /** Called when a drag gesture ends (persist heights). */
  onDragEnd?: () => void;
  /** Keyboard nudge amount in px. */
  nudge?: number;
  label?: string;
};

/**
 * Horizontal rail that resizes panels vertically — same interaction model as PanelDivider.
 */
export function VerticalResizeDivider({
  onDragDelta,
  onDragEnd,
  nudge = 8,
  label = "Resize panels",
}: VerticalResizeDividerProps) {
  const lastYRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  function startDrag(clientY: number, target: HTMLElement, pointerId: number) {
    draggingRef.current = true;
    lastYRef.current = clientY;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    try {
      target.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  }

  function moveDrag(clientY: number) {
    if (!draggingRef.current) {
      return;
    }
    const dy = clientY - lastYRef.current;
    lastYRef.current = clientY;
    if (dy !== 0) {
      onDragDelta(dy);
    }
  }

  function endDrag(target: HTMLElement, pointerId: number) {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    try {
      target.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    onDragEnd?.();
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      tabIndex={0}
      className="panel-divider panel-divider-horizontal group relative z-10 flex h-2 w-full shrink-0 cursor-row-resize items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        startDrag(event.clientY, event.currentTarget, event.pointerId);
      }}
      onPointerMove={(event) => {
        moveDrag(event.clientY);
      }}
      onPointerUp={(event) => {
        endDrag(event.currentTarget, event.pointerId);
      }}
      onPointerCancel={(event) => {
        endDrag(event.currentTarget, event.pointerId);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onDragDelta(-nudge);
          onDragEnd?.();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          onDragDelta(nudge);
          onDragEnd?.();
        }
      }}
    >
      <span className="panel-divider-rail panel-divider-rail-horizontal" aria-hidden />
      <span className="panel-divider-grip panel-divider-grip-horizontal" aria-hidden />
    </div>
  );
}
