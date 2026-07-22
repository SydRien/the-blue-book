"use client";

import type { ReactNode } from "react";

export type LeftRailTab = "projects" | "outline" | "characters";

type LeftRailProps = {
  tab: LeftRailTab;
  onTabChange: (tab: LeftRailTab) => void;
  projects: ReactNode;
  outline: ReactNode;
  characters: ReactNode;
};

export function LeftRail({
  tab,
  onTabChange,
  projects,
  outline,
  characters,
}: LeftRailProps) {
  return (
    <aside className="relative flex h-full min-h-0 w-full flex-col border-r border-panel-border bg-panel">
      <div className="flex items-center justify-between border-b border-panel-border px-2 py-2">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["projects", "Projects"],
              ["outline", "Outline"],
              ["characters", "Cast"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="module-button rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[9px] tracking-[0.14em] text-foreground uppercase"
              data-active={tab === id}
              onClick={() => onTabChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="panel-screw" />
          <span className="panel-screw" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "projects"
          ? projects
          : tab === "outline"
            ? outline
            : characters}
      </div>
    </aside>
  );
}
