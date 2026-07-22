"use client";

import { useEffect, useRef } from "react";

type PanelDividerProps = {
  /** Called with horizontal delta from last pointer position. */
  onDragDelta: (dx: number) => void;
  /** Called when a drag gesture ends (persist widths). */
  onDragEnd?: () => void;
  /** Keyboard nudge amount in px. */
  nudge?: number;
  label?: string;
};

export function PanelDivider({
  onDragDelta,
  onDragEnd,
  nudge = 8,
  label = "Resize panels",
}: PanelDividerProps) {
  const lastXRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  function startDrag(clientX: number, target: HTMLElement, pointerId: number) {
    draggingRef.current = true;
    lastXRef.current = clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    try {
      target.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  }

  function moveDrag(clientX: number) {
    if (!draggingRef.current) {
      return;
    }
    const dx = clientX - lastXRef.current;
    lastXRef.current = clientX;
    if (dx !== 0) {
      onDragDelta(dx);
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
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      className="panel-divider group relative z-10 flex w-2 shrink-0 cursor-col-resize items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        startDrag(event.clientX, event.currentTarget, event.pointerId);
      }}
      onPointerMove={(event) => {
        moveDrag(event.clientX);
      }}
      onPointerUp={(event) => {
        endDrag(event.currentTarget, event.pointerId);
      }}
      onPointerCancel={(event) => {
        endDrag(event.currentTarget, event.pointerId);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onDragDelta(-nudge);
          onDragEnd?.();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onDragDelta(nudge);
          onDragEnd?.();
        }
      }}
    >
      <span className="panel-divider-rail" aria-hidden />
      <span className="panel-divider-grip" aria-hidden />
    </div>
  );
}
