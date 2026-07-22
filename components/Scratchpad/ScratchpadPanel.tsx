"use client";

import { useEffect, useRef, useState } from "react";
import {
  NOTE_TYPES,
  type Note,
  type NoteType,
} from "@/lib/notes/types";

type ScratchpadPanelProps = {
  notes: Note[];
  selectedId: string | null;
  activeProjectId: string | null;
  activeProjectTitle?: string | null;
  onSelect: (note: Note) => void;
  onCreate: () => void;
  onRename: (note: Note) => void;
  onDelete: (note: Note) => void;
  onChangeContent: (noteId: string, content: string) => void;
  onChangeType: (noteId: string, type: NoteType) => void;
  onSaveToProject: (note: Note) => void;
};

const TYPE_LABELS: Record<NoteType, string> = {
  idea: "Idea",
  reference: "Ref",
  research: "Research",
  random: "Random",
};

export function ScratchpadPanel({
  notes,
  selectedId,
  activeProjectId,
  activeProjectTitle = null,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onChangeContent,
  onChangeType,
  onSaveToProject,
}: ScratchpadPanelProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = notes.find((note) => note.id === selectedId) ?? null;
  const savedToActive =
    selected &&
    activeProjectId &&
    selected.projectId === activeProjectId;

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
    <aside className="flex h-[min(32%,16rem)] min-h-[9rem] shrink-0 flex-col border-t border-panel-border bg-panel">
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-2">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
            Scratchpad
          </p>
          <p className="mt-0.5 font-mono text-[8px] tracking-[0.08em] text-muted">
            Creative space · not the script
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="panel-screw" aria-hidden />
          <span className="panel-screw" aria-hidden />
        </div>
      </div>

      <div className="border-b border-panel-border px-2 py-2">
        <button
          type="button"
          onClick={onCreate}
          className="module-button w-full rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[10px] tracking-[0.14em] text-foreground uppercase"
        >
          + New Note
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-[42%] shrink-0 flex-col border-r border-panel-border">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-1.5 py-1.5">
            {notes.length === 0 ? (
              <p className="px-1 py-2 font-mono text-[9px] leading-relaxed text-muted">
                Ideas, jokes, research — park them here.
              </p>
            ) : (
              notes.map((note) => {
                const isSelected = note.id === selectedId;
                const menuOpen = menuId === note.id;
                return (
                  <div
                    key={note.id}
                    className="relative flex items-center gap-0.5"
                    ref={menuOpen ? menuRef : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(note)}
                      className="module-button flex min-w-0 flex-1 items-center gap-1.5 rounded-sm border border-panel-border px-1.5 py-1.5 text-left"
                      data-active={isSelected}
                    >
                      <span
                        className="led-dot h-1.5 w-1.5 shrink-0 rounded-full bg-led-orange text-led-orange"
                        data-lit={isSelected}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground">
                        {note.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="module-button shrink-0 rounded-sm border border-panel-border px-1 py-1 font-mono text-[9px] text-muted"
                      title="Note actions"
                      onClick={() =>
                        setMenuId((current) =>
                          current === note.id ? null : note.id,
                        )
                      }
                    >
                      ⋯
                    </button>
                    {menuOpen ? (
                      <div className="absolute top-full right-0 z-30 mt-1 min-w-[7rem] rounded-sm border border-panel-border bg-panel-raised py-1 shadow-[0_8px_24px_var(--shadow-drop)]">
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:bg-panel-inset"
                          onClick={() => {
                            setMenuId(null);
                            onRename(note);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-[#c45c5c] uppercase hover:bg-panel-inset"
                          onClick={() => {
                            setMenuId(null);
                            onDelete(note);
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

        <div className="flex min-w-0 flex-1 flex-col px-2 py-2">
          {selected ? (
            <>
              <p className="mb-1 truncate font-mono text-[11px] tracking-[0.06em] text-foreground uppercase">
                {selected.title}
              </p>
              <div className="mb-2 grid grid-cols-2 gap-1">
                {NOTE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="module-button rounded-sm border border-panel-border py-1 font-mono text-[8px] tracking-[0.1em] text-foreground uppercase"
                    data-active={selected.type === type}
                    onClick={() => onChangeType(selected.id, type)}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <textarea
                value={selected.content}
                onChange={(event) =>
                  onChangeContent(selected.id, event.target.value)
                }
                placeholder="Write freely…"
                className="min-h-0 flex-1 resize-none rounded-sm border border-panel-border bg-panel-inset px-2 py-1.5 font-mono text-[11px] leading-relaxed text-foreground outline-none placeholder:text-muted focus:border-accent"
              />
              {activeProjectId ? (
                <button
                  type="button"
                  className="module-button mt-2 w-full rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[9px] tracking-[0.14em] text-foreground uppercase"
                  data-active={Boolean(savedToActive)}
                  disabled={Boolean(savedToActive)}
                  onClick={() => onSaveToProject(selected)}
                  title={
                    savedToActive
                      ? `Saved to ${activeProjectTitle ?? "project"}`
                      : `Save to ${activeProjectTitle ?? "project"}`
                  }
                >
                  {savedToActive
                    ? `Saved · ${activeProjectTitle ?? "Project"}`
                    : "Save to Project"}
                </button>
              ) : (
                <p className="mt-2 font-mono text-[8px] tracking-[0.08em] text-muted uppercase">
                  Open a project to save
                </p>
              )}
            </>
          ) : (
            <p className="font-mono text-[9px] leading-relaxed text-muted">
              Select a note — or create one — to jot something down.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
