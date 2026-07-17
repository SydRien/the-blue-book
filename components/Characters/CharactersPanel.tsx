"use client";

import { useEffect, useRef, useState } from "react";
import type { CharacterRecord } from "@/lib/entities/characters/types";

type CharactersPanelProps = {
  characters: CharacterRecord[];
  selectedId: string | null;
  onSelect: (character: CharacterRecord) => void;
  onCreate: () => void;
  onRename: (character: CharacterRecord) => void;
  onDelete: (character: CharacterRecord) => void;
};

export function CharactersPanel({
  characters,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: CharactersPanelProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-panel-border px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Characters
        </p>
        <p className="mt-1 font-mono text-[9px] text-muted">
          App-scoped entity database
        </p>
      </div>

      <div className="border-b border-panel-border px-2 py-2">
        <button
          type="button"
          onClick={onCreate}
          className="module-button w-full rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[10px] tracking-[0.14em] text-foreground uppercase"
        >
          + New Character
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {characters.length === 0 ? (
          <p className="px-1 py-3 font-mono text-[10px] leading-relaxed text-muted">
            No characters yet. Create one to organize cast.
          </p>
        ) : (
          characters.map((character) => {
            const selected = character.id === selectedId;
            const menuOpen = menuId === character.id;

            return (
              <div
                key={character.id}
                className="relative flex items-center gap-0.5"
                ref={menuOpen ? menuRef : undefined}
              >
                <button
                  type="button"
                  onClick={() => onSelect(character)}
                  className="module-button flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-panel-border px-2 py-2 text-left"
                  data-active={selected}
                >
                  <span
                    className="led-dot h-1.5 w-1.5 shrink-0 rounded-full"
                    data-lit="true"
                    style={{
                      color: character.color,
                      backgroundColor: character.color,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground uppercase">
                    {character.name}
                  </span>
                </button>
                <button
                  type="button"
                  className="module-button shrink-0 rounded-sm border border-panel-border px-1.5 py-1 font-mono text-[10px] text-muted"
                  title="Character actions"
                  onClick={() =>
                    setMenuId((current) =>
                      current === character.id ? null : character.id,
                    )
                  }
                >
                  ⋯
                </button>
                {menuOpen ? (
                  <div className="absolute top-full right-0 z-20 mt-1 min-w-[7.5rem] rounded-sm border border-panel-border bg-panel-raised py-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:bg-panel-inset"
                      onClick={() => {
                        setMenuId(null);
                        onRename(character);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-[#c45c5c] uppercase hover:bg-panel-inset"
                      onClick={() => {
                        setMenuId(null);
                        onDelete(character);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
