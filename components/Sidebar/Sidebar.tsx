"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectWithDocuments } from "@/types/project";

type SidebarProps = {
  projects: ProjectWithDocuments[];
  activeProjectId: string | null;
  activeDocumentId: string | null;
  onSelectDocument: (projectId: string, documentId: string) => void;
  onCreateProject: () => void;
  onRenameProject: (projectId: string, title: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  creatingProject?: boolean;
};

type DialogState =
  | { type: "rename"; projectId: string; title: string }
  | { type: "delete"; projectId: string; title: string }
  | null;

export function Sidebar({
  projects,
  activeProjectId,
  activeDocumentId,
  onSelectDocument,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  creatingProject = false,
}: SidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function openRename(projectId: string, title: string) {
    setOpenMenuId(null);
    setError(null);
    setDraftTitle(title);
    setDialog({ type: "rename", projectId, title });
  }

  function openDelete(projectId: string, title: string) {
    setOpenMenuId(null);
    setError(null);
    setDialog({ type: "delete", projectId, title });
  }

  async function confirmRename() {
    if (!dialog || dialog.type !== "rename") {
      return;
    }

    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setError("Title is required");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onRenameProject(dialog.projectId, nextTitle);
      setDialog(null);
    } catch (renameError) {
      setError(
        renameError instanceof Error
          ? renameError.message
          : "Failed to rename project",
      );
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!dialog || dialog.type !== "delete") {
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onDeleteProject(dialog.projectId);
      setDialog(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete project",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="relative flex w-60 shrink-0 flex-col border-r border-panel-border bg-panel">
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Projects
        </p>
        <div className="flex items-center gap-1.5">
          <span className="panel-screw" aria-hidden />
          <span className="panel-screw" aria-hidden />
        </div>
      </div>

      <div className="border-b border-panel-border px-2 py-2">
        <button
          type="button"
          onClick={onCreateProject}
          disabled={creatingProject}
          className="module-button w-full rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[10px] tracking-[0.14em] text-foreground uppercase"
        >
          {creatingProject ? "Creating…" : "+ New Project"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {projects.length === 0 ? (
          <p className="px-1 font-mono text-[11px] leading-relaxed text-muted">
            No projects yet. Create one to start writing.
          </p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => {
              const isProjectActive = project.id === activeProjectId;
              const menuOpen = openMenuId === project.id;

              return (
                <li key={project.id}>
                  <div className="mb-1 flex items-center gap-1 px-1">
                    <span
                      className={`led-dot h-1.5 w-1.5 shrink-0 rounded-full ${
                        isProjectActive
                          ? "bg-led-cyan text-led-cyan"
                          : "bg-[#3a3a42] text-transparent"
                      }`}
                      aria-hidden
                    />
                    <p
                      className={`min-w-0 flex-1 truncate font-mono text-[11px] tracking-[0.08em] uppercase ${
                        isProjectActive ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {project.title}
                    </p>
                    <div
                      className="relative"
                      ref={menuOpen ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        aria-label={`Project menu for ${project.title}`}
                        className="module-button rounded-sm border border-transparent px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-muted hover:border-panel-border hover:text-foreground"
                        data-active={menuOpen}
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current === project.id ? null : project.id,
                          )
                        }
                      >
                        ···
                      </button>
                      {menuOpen ? (
                        <div className="absolute top-full right-0 z-20 mt-1 w-36 rounded-sm border border-panel-border bg-panel-raised p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                          <button
                            type="button"
                            className="module-button mb-0.5 w-full rounded-sm border border-transparent px-2 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:border-panel-border"
                            onClick={() =>
                              openRename(project.id, project.title)
                            }
                          >
                            Rename Project
                          </button>
                          <button
                            type="button"
                            className="module-button w-full rounded-sm border border-transparent px-2 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-[#e89a5b] uppercase hover:border-panel-border"
                            onClick={() =>
                              openDelete(project.id, project.title)
                            }
                          >
                            Delete Project
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <ul className="ml-3 space-y-0.5 border-l border-panel-border pl-2">
                    {project.documents.map((document) => {
                      const isActive =
                        project.id === activeProjectId &&
                        document.id === activeDocumentId;
                      return (
                        <li key={document.id}>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectDocument(project.id, document.id)
                            }
                            className={`module-button flex w-full items-center justify-between rounded-sm border px-2 py-1.5 text-left ${
                              isActive
                                ? "border-accent-soft"
                                : "border-transparent"
                            }`}
                            data-active={isActive}
                          >
                            <span className="font-mono text-[11px] text-foreground">
                              {document.title}
                            </span>
                            {isActive ? (
                              <span className="font-mono text-[9px] tracking-widest text-led-blue uppercase">
                                Open
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-panel-border bg-panel-raised px-3 py-2">
        <p className="font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
          Offline-first · Local then cloud
        </p>
      </div>

      {dialog ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-3">
          <div className="w-full rounded-sm border border-panel-border bg-panel p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                {dialog.type === "rename" ? "Rename Project" : "Delete Project"}
              </p>
              <div className="flex gap-1.5" aria-hidden>
                <span className="panel-screw" />
                <span className="panel-screw" />
              </div>
            </div>

            {dialog.type === "rename" ? (
              <>
                <label className="mb-3 block">
                  <span className="mb-1 block font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
                    Title
                  </span>
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void confirmRename();
                      }
                    }}
                    className="w-full rounded-sm border border-panel-border bg-panel-inset px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-accent-soft"
                  />
                </label>
              </>
            ) : (
              <p className="mb-3 font-mono text-[11px] leading-relaxed text-foreground">
                Delete{" "}
                <span className="text-led-orange">{dialog.title}</span>? This
                removes the project and its documents.
              </p>
            )}

            {error ? (
              <p className="mb-3 font-mono text-[10px] text-[#c45c5c]">{error}</p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                className="module-button flex-1 rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase"
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                className="module-button flex-1 rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] text-foreground uppercase"
                data-active="true"
                onClick={() => {
                  if (dialog.type === "rename") {
                    void confirmRename();
                  } else {
                    void confirmDelete();
                  }
                }}
              >
                {pending
                  ? "Working…"
                  : dialog.type === "rename"
                    ? "Save"
                    : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
