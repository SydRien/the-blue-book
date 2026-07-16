import { SCRIPT_BLOCK_TYPES, type ScriptBlockType } from "@/types/document";

type EditorToolbarProps = {
  activeType: ScriptBlockType;
  onSelectType: (type: ScriptBlockType) => void;
  onOpenExport?: () => void;
};

export function EditorToolbar({
  activeType,
  onSelectType,
  onOpenExport,
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
        {SCRIPT_BLOCK_TYPES.map((block) => {
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
                style={{
                  color: block.accent,
                  backgroundColor: isActive ? block.accent : "#3a3a42",
                }}
                aria-hidden
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-foreground uppercase">
                {block.label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="module-button ml-auto flex min-w-[5.5rem] items-center justify-center gap-2 rounded-sm border border-panel-border px-3 py-2"
          onClick={onOpenExport}
          title="Export screenplay PDF"
        >
          <span
            className="led-dot h-1.5 w-1.5 rounded-full bg-led-green text-led-green"
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
