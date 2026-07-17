"use client";

import type { CharacterRecord } from "@/lib/entities/characters/types";

type EntityLinkSectionProps = {
  blockId: string;
  cueText: string;
  linked: CharacterRecord | null;
  characters: CharacterRecord[];
  onCreateFromCue: () => void;
  onLink: (characterId: string) => void;
  onUnlink: () => void;
};

export function EntityLinkSection({
  blockId: _blockId,
  cueText,
  linked,
  characters,
  onCreateFromCue,
  onLink,
  onUnlink,
}: EntityLinkSectionProps) {
  return (
    <div>
      <p className="mb-2 font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
        Entity Link
      </p>
      <div className="space-y-2 rounded-sm border border-panel-border bg-panel-inset p-2">
        {linked ? (
          <>
            <p className="font-mono text-[10px] text-led-orange uppercase">
              Linked · {linked.name}
            </p>
            <button
              type="button"
              onClick={onUnlink}
              className="module-button w-full rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[9px] tracking-[0.12em] text-muted uppercase"
            >
              Unlink
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onCreateFromCue}
              className="module-button w-full rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[9px] tracking-[0.12em] text-foreground uppercase"
              data-active="true"
            >
              Create Character
              {cueText.trim() ? (
                <span className="mt-0.5 block truncate normal-case tracking-normal text-muted">
                  from “{cueText.trim().slice(0, 28)}”
                </span>
              ) : null}
            </button>
            {characters.length > 0 ? (
              <div>
                <p className="mb-1 font-mono text-[8px] tracking-[0.14em] text-muted uppercase">
                  Link Existing
                </p>
                <select
                  className="bb-native-select w-full rounded-sm border border-panel-border bg-panel px-2 py-1.5 font-mono text-[10px] outline-none"
                  defaultValue=""
                  onChange={(event) => {
                    const id = event.target.value;
                    if (id) {
                      onLink(id);
                      event.target.value = "";
                    }
                  }}
                >
                  <option value="">Select character…</option>
                  {characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
