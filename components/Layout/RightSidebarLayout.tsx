"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VerticalResizeDivider } from "@/components/Layout/VerticalResizeDivider";
import {
  INSPECTOR_HEIGHT_MIN,
  JON_HEIGHT_MIN,
  loadRightSidebarLayout,
  normalizeRightSidebarHeights,
  RIGHT_SIDEBAR_DIVIDER_TOTAL,
  saveRightSidebarLayout,
  SCRATCHPAD_HEIGHT_MIN,
  type RightSidebarLayoutPreferences,
} from "@/components/Layout/rightSidebarLayoutStorage";

type RightSidebarLayoutProps = {
  inspector: ReactNode;
  scratchpad: ReactNode;
  jon: ReactNode;
};

export function RightSidebarLayout({
  inspector,
  scratchpad,
  jon,
}: RightSidebarLayoutProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [heights, setHeights] = useState<RightSidebarLayoutPreferences>(() =>
    normalizeRightSidebarHeights(900, loadRightSidebarLayout()),
  );
  const heightsRef = useRef(heights);

  useEffect(() => {
    heightsRef.current = heights;
  }, [heights]);

  const fitToContainer = useCallback(() => {
    const total = rootRef.current?.clientHeight ?? 0;
    if (total <= 0) {
      return;
    }
    const available = Math.max(0, total - RIGHT_SIDEBAR_DIVIDER_TOTAL);
    const next = normalizeRightSidebarHeights(available, heightsRef.current);
    heightsRef.current = next;
    setHeights(next);
  }, []);

  useEffect(() => {
    const prefs = loadRightSidebarLayout();
    heightsRef.current = prefs;
    setHeights(prefs);
    // Fit after paint so clientHeight is available.
    requestAnimationFrame(() => {
      fitToContainer();
    });
  }, [fitToContainer]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      fitToContainer();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [fitToContainer]);

  const persist = useCallback(() => {
    saveRightSidebarLayout(heightsRef.current);
  }, []);

  function applyInspectorScratchpad(dy: number) {
    const current = heightsRef.current;
    let nextInspector = current.inspectorHeight + dy;
    let nextScratchpad = current.scratchpadHeight - dy;

    if (nextInspector < INSPECTOR_HEIGHT_MIN) {
      const fix = INSPECTOR_HEIGHT_MIN - nextInspector;
      nextInspector = INSPECTOR_HEIGHT_MIN;
      nextScratchpad -= fix;
    }
    if (nextScratchpad < SCRATCHPAD_HEIGHT_MIN) {
      const fix = SCRATCHPAD_HEIGHT_MIN - nextScratchpad;
      nextScratchpad = SCRATCHPAD_HEIGHT_MIN;
      nextInspector -= fix;
    }
    if (nextInspector < INSPECTOR_HEIGHT_MIN) {
      return;
    }

    const next: RightSidebarLayoutPreferences = {
      ...current,
      inspectorHeight: Math.round(nextInspector),
      scratchpadHeight: Math.round(nextScratchpad),
    };
    heightsRef.current = next;
    setHeights(next);
  }

  function applyScratchpadJon(dy: number) {
    const current = heightsRef.current;
    let nextScratchpad = current.scratchpadHeight + dy;
    let nextJon = current.jonHeight - dy;

    if (nextScratchpad < SCRATCHPAD_HEIGHT_MIN) {
      const fix = SCRATCHPAD_HEIGHT_MIN - nextScratchpad;
      nextScratchpad = SCRATCHPAD_HEIGHT_MIN;
      nextJon -= fix;
    }
    if (nextJon < JON_HEIGHT_MIN) {
      const fix = JON_HEIGHT_MIN - nextJon;
      nextJon = JON_HEIGHT_MIN;
      nextScratchpad -= fix;
    }
    if (nextScratchpad < SCRATCHPAD_HEIGHT_MIN) {
      return;
    }

    const next: RightSidebarLayoutPreferences = {
      ...current,
      scratchpadHeight: Math.round(nextScratchpad),
      jonHeight: Math.round(nextJon),
    };
    heightsRef.current = next;
    setHeights(next);
  }

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-panel-border bg-panel"
    >
      <div
        className="min-h-0 shrink-0 overflow-hidden"
        style={{ height: heights.inspectorHeight }}
      >
        {inspector}
      </div>

      <VerticalResizeDivider
        label="Resize inspector and scratchpad"
        onDragDelta={applyInspectorScratchpad}
        onDragEnd={persist}
      />

      <div
        className="min-h-0 shrink-0 overflow-hidden"
        style={{ height: heights.scratchpadHeight }}
      >
        {scratchpad}
      </div>

      <VerticalResizeDivider
        label="Resize scratchpad and Jon"
        onDragDelta={applyScratchpadJon}
        onDragEnd={persist}
      />

      <div
        className="min-h-0 shrink-0 overflow-hidden"
        style={{ height: heights.jonHeight }}
      >
        {jon}
      </div>
    </div>
  );
}
