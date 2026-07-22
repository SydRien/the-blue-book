"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PanelDivider } from "@/components/Layout/PanelDivider";
import { ResizablePanel } from "@/components/Layout/ResizablePanel";
import {
  clampLeftWidth,
  clampRightWidth,
  EDITOR_MIN_WIDTH,
  LEFT_SIDEBAR_DEFAULT,
  LEFT_SIDEBAR_MAX,
  LEFT_SIDEBAR_MIN,
  loadLayoutPreferences,
  RIGHT_SIDEBAR_DEFAULT,
  RIGHT_SIDEBAR_MAX,
  RIGHT_SIDEBAR_MIN,
  saveLayoutPreferences,
} from "@/components/Layout/layoutStorage";

type WorkspaceLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export function WorkspaceLayout({ left, center, right }: WorkspaceLayoutProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [leftWidth, setLeftWidth] = useState(LEFT_SIDEBAR_DEFAULT);
  const [rightWidth, setRightWidth] = useState(RIGHT_SIDEBAR_DEFAULT);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const leftWidthRef = useRef(leftWidth);
  const rightWidthRef = useRef(rightWidth);
  const leftCollapsedRef = useRef(leftCollapsed);
  const rightCollapsedRef = useRef(rightCollapsed);

  useEffect(() => {
    leftWidthRef.current = leftWidth;
  }, [leftWidth]);
  useEffect(() => {
    rightWidthRef.current = rightWidth;
  }, [rightWidth]);
  useEffect(() => {
    leftCollapsedRef.current = leftCollapsed;
  }, [leftCollapsed]);
  useEffect(() => {
    rightCollapsedRef.current = rightCollapsed;
  }, [rightCollapsed]);

  useEffect(() => {
    const prefs = loadLayoutPreferences();
    setLeftWidth(prefs.leftSidebarWidth);
    setRightWidth(prefs.rightSidebarWidth);
    leftWidthRef.current = prefs.leftSidebarWidth;
    rightWidthRef.current = prefs.rightSidebarWidth;
  }, []);

  const persist = useCallback(() => {
    saveLayoutPreferences({
      leftSidebarWidth: leftWidthRef.current,
      rightSidebarWidth: rightWidthRef.current,
    });
  }, []);

  function availableForSidebars(): number {
    const total = rootRef.current?.clientWidth ?? 1200;
    return Math.max(0, total - EDITOR_MIN_WIDTH);
  }

  function applyLeftWidth(next: number) {
    const rightOccupied = rightCollapsedRef.current
      ? 0
      : rightWidthRef.current;
    const maxAllowed = Math.min(
      LEFT_SIDEBAR_MAX,
      availableForSidebars() - rightOccupied,
    );
    const clamped = clampLeftWidth(
      Math.min(next, Math.max(LEFT_SIDEBAR_MIN, maxAllowed)),
    );
    leftWidthRef.current = clamped;
    setLeftWidth(clamped);
    return clamped;
  }

  function applyRightWidth(next: number) {
    const leftOccupied = leftCollapsedRef.current ? 0 : leftWidthRef.current;
    const maxAllowed = Math.min(
      RIGHT_SIDEBAR_MAX,
      availableForSidebars() - leftOccupied,
    );
    const clamped = clampRightWidth(
      Math.min(next, Math.max(RIGHT_SIDEBAR_MIN, maxAllowed)),
    );
    rightWidthRef.current = clamped;
    setRightWidth(clamped);
    return clamped;
  }

  return (
    <div ref={rootRef} className="flex min-h-0 flex-1">
      <ResizablePanel
        side="left"
        width={leftWidth}
        collapsed={leftCollapsed}
        onCollapseToggle={() => {
          setLeftCollapsed((value) => !value);
        }}
        collapseLabel="Collapse left panel"
        expandLabel="Expand left panel"
      >
        {left}
      </ResizablePanel>

      {!leftCollapsed ? (
        <PanelDivider
          label="Resize left sidebar"
          onDragDelta={(dx) => {
            applyLeftWidth(leftWidthRef.current + dx);
          }}
          onDragEnd={persist}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {center}
      </div>

      {!rightCollapsed ? (
        <PanelDivider
          label="Resize right sidebar"
          onDragDelta={(dx) => {
            applyRightWidth(rightWidthRef.current - dx);
          }}
          onDragEnd={persist}
        />
      ) : null}

      <ResizablePanel
        side="right"
        width={rightWidth}
        collapsed={rightCollapsed}
        onCollapseToggle={() => {
          setRightCollapsed((value) => !value);
        }}
        collapseLabel="Collapse right panel"
        expandLabel="Expand right panel"
      >
        {right}
      </ResizablePanel>
    </div>
  );
}
