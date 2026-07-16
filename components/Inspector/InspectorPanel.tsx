import type { ReactNode } from "react";
import { FONT_OPTIONS, SIZE_OPTIONS } from "@/lib/mock-data";
import {
  SCRIPT_BLOCK_TYPES,
  type ScriptBlockType,
} from "@/types/document";

export type InspectorSettings = {
  type: ScriptBlockType;
  font: string;
  size: number;
  exportVisible: boolean;
};

type InspectorPanelProps = {
  settings: InspectorSettings;
  onChange: (next: InspectorSettings) => void;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
      {children}
    </label>
  );
}

export function InspectorPanel({ settings, onChange }: InspectorPanelProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-panel-border bg-panel">
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Block Inspector
        </p>
        <div className="flex items-center gap-1.5">
          <span className="panel-screw" aria-hidden />
          <span className="panel-screw" aria-hidden />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div>
          <FieldLabel>Type</FieldLabel>
          <div className="rounded-sm border border-panel-border bg-panel-inset p-1">
            <select
              className="w-full bg-transparent px-2 py-1.5 font-mono text-xs text-foreground outline-none"
              value={settings.type}
              onChange={(event) =>
                onChange({
                  ...settings,
                  type: event.target.value as ScriptBlockType,
                })
              }
            >
              {SCRIPT_BLOCK_TYPES.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>Font</FieldLabel>
          <div className="rounded-sm border border-panel-border bg-panel-inset p-1">
            <select
              className="w-full bg-transparent px-2 py-1.5 font-mono text-xs text-foreground outline-none"
              value={settings.font}
              onChange={(event) =>
                onChange({ ...settings, font: event.target.value })
              }
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>Size</FieldLabel>
          <div className="grid grid-cols-5 gap-1">
            {SIZE_OPTIONS.map((size) => {
              const isActive = settings.size === size;
              return (
                <button
                  key={size}
                  type="button"
                  className="module-button rounded-sm border border-panel-border py-1.5 font-mono text-[10px] text-foreground"
                  data-active={isActive}
                  onClick={() => onChange({ ...settings, size })}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Export visibility</FieldLabel>
          <button
            type="button"
            className="module-button flex w-full items-center justify-between rounded-sm border border-panel-border px-3 py-2"
            data-active={settings.exportVisible}
            onClick={() =>
              onChange({
                ...settings,
                exportVisible: !settings.exportVisible,
              })
            }
          >
            <span className="font-mono text-[11px] tracking-[0.12em] uppercase">
              {settings.exportVisible ? "Export On" : "Export Off"}
            </span>
            <span
              className={`led-dot h-2 w-2 rounded-full ${
                settings.exportVisible
                  ? "bg-led-green text-led-green"
                  : "bg-[#3a3a42] text-transparent"
              }`}
              aria-hidden
            />
          </button>
        </div>

        <div className="rounded-sm border border-panel-border bg-panel-raised px-3 py-2">
          <p className="font-mono text-[9px] leading-relaxed tracking-[0.08em] text-muted uppercase">
            Writes to structured block attrs in memory.
          </p>
        </div>
      </div>
    </aside>
  );
}
