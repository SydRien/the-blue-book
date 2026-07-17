"use client";

import { useEffect, useRef, useState } from "react";
import type { BlockDefinition } from "@/lib/blocks/types";

type BlockTypesPanelProps = {
  definitions: BlockDefinition[];
  onCreate: () => void;
  onRename: (definition: BlockDefinition) => void;
  onDelete: (definition: BlockDefinition) => void;
};

export function BlockTypesPanel({
  definitions,
  onCreate,
  onRename,
  onDelete,
}: BlockTypesPanelProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const custom = definitions.filter((item) => !item.builtIn);
  const builtIn = definitions.filter((item) => item.builtIn);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuId(null);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
          Block Types
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-foreground uppercase"
        >
          + New
        </button>
      </div>

      <div className="space-y-1 rounded-sm border border-panel-border bg-panel-inset p-1.5">
        <p className="px-1.5 py-1 font-mono text-[8px] tracking-[0.14em] text-muted uppercase">
          Built-in
        </p>
        {builtIn.map((definition) => (
          <div
            key={definition.id}
            className="flex items-center gap-2 rounded-sm px-1.5 py-1"
          >
            <span
              className="led-dot h-1.5 w-1.5 shrink-0 rounded-full"
              data-lit="true"
              style={{
                color: definition.editorStyle.accent,
                backgroundColor: definition.editorStyle.accent,
              }}
              aria-hidden
            />
            <span className="truncate font-mono text-[10px] text-foreground">
              {definition.name}
            </span>
          </div>
        ))}

        <p className="mt-2 px-1.5 py-1 font-mono text-[8px] tracking-[0.14em] text-muted uppercase">
          Custom
        </p>
        {custom.length === 0 ? (
          <p className="px-1.5 py-1 font-mono text-[9px] text-muted">
            No custom types yet
          </p>
        ) : (
          custom.map((definition) => (
            <div
              key={definition.id}
              className="relative flex items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-panel"
              ref={menuId === definition.id ? menuRef : undefined}
            >
              <span
                className="led-dot h-1.5 w-1.5 shrink-0 rounded-full"
                data-lit="true"
                style={{
                  color: definition.editorStyle.accent,
                  backgroundColor: definition.editorStyle.accent,
                }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground">
                {definition.name}
              </span>
              <button
                type="button"
                className="module-button rounded-sm border border-panel-border px-1.5 py-0.5 font-mono text-[10px] text-muted"
                title="Type actions"
                onClick={() =>
                  setMenuId((current) =>
                    current === definition.id ? null : definition.id,
                  )
                }
              >
                ⋯
              </button>
              {menuId === definition.id ? (
                <div className="absolute top-full right-0 z-20 mt-1 min-w-[7.5rem] rounded-sm border border-panel-border bg-panel-raised py-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                  <button
                    type="button"
                    className="block w-full px-3 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:bg-panel-inset"
                    onClick={() => {
                      setMenuId(null);
                      onRename(definition);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-[#c45c5c] uppercase hover:bg-panel-inset"
                    onClick={() => {
                      setMenuId(null);
                      onDelete(definition);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
