"use client";

import type { BlockDefinition } from "@/lib/blocks/types";
import type { BlockTypeId } from "@/types/document";

type EditorToolbarProps = {
  activeType: BlockTypeId;
  blockTypes: BlockDefinition[];
  onSelectType: (type: BlockTypeId) => void;
  onOpenExport?: () => void;
  onOpenStatistics?: () => void;
  onOpenSaveVersion?: () => void;
};

export function EditorToolbar({
  activeType,
  blockTypes,
  onSelectType,
  onOpenExport,
  onOpenStatistics,
  onOpenSaveVersion,
}: EditorToolbarProps) {
  return (
    <div className="border-b border-panel-border bg-panel px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Block Modules
        </p>
        <div className="flex items-center gap-1.5">
          <span className="panel-screw" aria-hidden />
          <span className="panel-screw" aria-hidden />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {blockTypes.map((block) => {
          const isActive = activeType === block.id;
          return (
            <button
              key={block.id}
              type="button"
              className="module-button flex min-w-[6.5rem] items-center gap-2 rounded-sm border border-panel-border px-3 py-2"
              data-active={isActive}
              onClick={() => onSelectType(block.id)}
            >
              <span
                className="led-dot h-1.5 w-1.5 rounded-full"
                data-lit={isActive}
                style={{
                  color: block.editorStyle.accent,
                  backgroundColor: isActive
                    ? block.editorStyle.accent
                    : "#3a3a42",
                }}
                aria-hidden
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-foreground uppercase">
                {block.name}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="module-button ml-auto flex min-w-[5.5rem] items-center justify-center gap-2 rounded-sm border border-panel-border px-3 py-2"
          onClick={onOpenSaveVersion}
          title="Save document version snapshot"
        >
          <span
            className="led-dot h-1.5 w-1.5 rounded-full bg-led-orange text-led-orange"
            data-lit="true"
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-[0.14em] text-foreground uppercase">
            Save Version
          </span>
        </button>
        <button
          type="button"
          className="module-button flex min-w-[5.5rem] items-center justify-center gap-2 rounded-sm border border-panel-border px-3 py-2"
          onClick={onOpenStatistics}
          title="Writing statistics"
        >
          <span
            className="led-dot h-1.5 w-1.5 rounded-full bg-led-cyan text-led-cyan"
            data-lit="true"
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-[0.14em] text-foreground uppercase">
            Stats
          </span>
        </button>
        <button
          type="button"
          className="module-button flex min-w-[5.5rem] items-center justify-center gap-2 rounded-sm border border-panel-border px-3 py-2"
          onClick={onOpenExport}
          title="Export document"
        >
          <span
            className="led-dot h-1.5 w-1.5 rounded-full bg-led-green text-led-green"
            data-lit="true"
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-[0.14em] text-foreground uppercase">
            Export
          </span>
        </button>
      </div>
    </div>
  );
}
