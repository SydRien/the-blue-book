"use client";

import type { ReactNode } from "react";
import {
  resolveLinkedBlocks,
  type LinkedBlockRef,
} from "@/lib/entities/characters/characterUtils";
import type { CharacterRecord } from "@/lib/entities/characters/types";
import type { BlueBookDocument } from "@/types/document";

type CharacterInspectorProps = {
  character: CharacterRecord;
  document: BlueBookDocument | null;
  onChange: (patch: Partial<CharacterRecord>) => void;
  onJumpToBlock: (blockId: string) => void;
  onClose?: () => void;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows = 1,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {rows > 1 ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y rounded-sm border border-panel-border bg-panel-inset px-2 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-accent"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-sm border border-panel-border bg-panel-inset px-2 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-accent"
        />
      )}
    </div>
  );
}

function LinkedBlockRow({
  item,
  onJump,
}: {
  item: LinkedBlockRef;
  onJump: (blockId: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={!item.inCurrentDocument}
      onClick={() => onJump(item.blockId)}
      className="module-button w-full rounded-sm border border-panel-border px-2 py-1.5 text-left disabled:opacity-40"
    >
      <p className="font-mono text-[9px] tracking-[0.12em] text-led-cyan uppercase">
        {item.sceneLabel ?? "No scene"} · {item.type}
      </p>
      <p className="mt-0.5 truncate font-mono text-[10px] text-foreground">
        {item.snippet}
      </p>
    </button>
  );
}

export function CharacterInspector({
  character,
  document,
  onChange,
  onJumpToBlock,
  onClose,
}: CharacterInspectorProps) {
  const linked = resolveLinkedBlocks(character, document);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-panel">
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Character Inspector
        </p>
        <div className="flex items-center gap-1.5">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="module-button rounded-sm border border-panel-border px-1.5 py-0.5 font-mono text-[9px] text-muted uppercase"
            >
              Block
            </button>
          ) : null}
          <span className="panel-screw" aria-hidden />
          <span className="panel-screw" aria-hidden />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <TextField
          label="Name"
          value={character.name}
          onChange={(name) => onChange({ name })}
        />
        <TextField
          label="Role"
          value={character.role}
          onChange={(role) => onChange({ role })}
        />
        <TextField
          label="Description"
          value={character.description}
          rows={3}
          onChange={(description) => onChange({ description })}
        />
        <TextField
          label="Notes"
          value={character.notes}
          rows={3}
          onChange={(notes) => onChange({ notes })}
        />

        <div>
          <FieldLabel>Linked Blocks</FieldLabel>
          <div className="space-y-1">
            {linked.length === 0 ? (
              <p className="font-mono text-[9px] text-muted">
                No linked blocks. Use Entity Link on a character cue.
              </p>
            ) : (
              linked.map((item) => (
                <LinkedBlockRow
                  key={item.blockId}
                  item={item}
                  onJump={onJumpToBlock}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
