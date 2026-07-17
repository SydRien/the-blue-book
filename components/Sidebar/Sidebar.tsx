"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectWithDocuments } from "@/types/project";

type SidebarProps = {
  projects: ProjectWithDocuments[];
  activeProjectId: string | null;
  activeDocumentId: string | null;
  onSelectDocument: (projectId: string, documentId: string) => void;
  onCreateProject: () => void;
  onCreateDocument: (projectId: string) => Promise<void>;
  onRenameProject: (projectId: string, title: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onRenameDocument: (documentId: string, title: string) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onOpenVersionHistory?: (documentId: string) => void;
  creatingProject?: boolean;
  creatingDocumentId?: string | null;
  /** When true, omit outer aside chrome (parent LeftRail provides shell). */
  embedded?: boolean;
};

type DialogState =
  | { kind: "project-rename"; projectId: string; title: string }
  | { kind: "project-delete"; projectId: string; title: string }
  | {
      kind: "document-rename";
      projectId: string;
      documentId: string;
      title: string;
    }
  | {
      kind: "document-delete";
      projectId: string;
      documentId: string;
      title: string;
    }
  | null;

export function Sidebar({
  projects,
  activeProjectId,
  activeDocumentId,
  onSelectDocument,
  onCreateProject,
  onCreateDocument,
  onRenameProject,
  onDeleteProject,
  onRenameDocument,
  onDeleteDocument,
  onOpenVersionHistory,
  creatingProject = false,
  creatingDocumentId = null,
  embedded = false,
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

  function openDialog(next: DialogState) {
    setOpenMenuId(null);
    setError(null);
    if (next && "title" in next) {
      setDraftTitle(next.title);
    }
    setDialog(next);
  }

  async function confirmDialog() {
    if (!dialog) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      switch (dialog.kind) {
        case "project-rename": {
          const nextTitle = draftTitle.trim();
          if (!nextTitle) {
            setError("Title is required");
            return;
          }
          await onRenameProject(dialog.projectId, nextTitle);
          break;
        }
        case "project-delete":
          await onDeleteProject(dialog.projectId);
          break;
        case "document-rename": {
          const nextTitle = draftTitle.trim();
          if (!nextTitle) {
            setError("Title is required");
            return;
          }
          await onRenameDocument(dialog.documentId, nextTitle);
          break;
        }
        case "document-delete":
          await onDeleteDocument(dialog.documentId);
          break;
      }
      setDialog(null);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Action failed",
      );
    } finally {
      setPending(false);
    }
  }

  const dialogTitle =
    dialog?.kind === "project-rename"
      ? "Rename Project"
      : dialog?.kind === "project-delete"
        ? "Delete Project"
        : dialog?.kind === "document-rename"
          ? "Rename Document"
          : dialog?.kind === "document-delete"
            ? "Delete Document"
            : "";

  const isRenameDialog =
    dialog?.kind === "project-rename" || dialog?.kind === "document-rename";

  const Shell = embedded ? "div" : "aside";

  return (
    <Shell
      className={
        embedded
          ? "relative flex min-h-0 flex-1 flex-col"
          : "relative flex w-60 shrink-0 flex-col border-r border-panel-border bg-panel"
      }
    >
      {!embedded ? (
        <div className="flex items-center justify-between border-b border-panel-border px-3 py-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
            Projects
          </p>
          <div className="flex items-center gap-1.5">
            <span className="panel-screw" aria-hidden />
            <span className="panel-screw" aria-hidden />
          </div>
        </div>
      ) : null}

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
              const projectMenuId = `project:${project.id}`;
              const projectMenuOpen = openMenuId === projectMenuId;
              const creatingDoc = creatingDocumentId === project.id;

              return (
                <li key={project.id}>
                  <div className="mb-1 flex items-center gap-1 px-1">
                    <span
                      className={`led-dot h-1.5 w-1.5 shrink-0 rounded-full ${
                        isProjectActive
                          ? "bg-led-cyan text-led-cyan"
                          : "bg-[#3a3a42] text-transparent"
                      }`}
                      data-lit={isProjectActive}
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
                      ref={projectMenuOpen ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        aria-label={`Project menu for ${project.title}`}
                        className="module-button rounded-sm border border-transparent px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-muted hover:border-panel-border hover:text-foreground"
                        data-active={projectMenuOpen}
                        onClick={() =>
                          setOpenMenuId((current) =>
                            current === projectMenuId ? null : projectMenuId,
                          )
                        }
                      >
                        ···
                      </button>
                      {projectMenuOpen ? (
                        <div className="absolute top-full right-0 z-20 mt-1 w-40 rounded-sm border border-panel-border bg-panel-raised p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                          <button
                            type="button"
                            className="module-button mb-0.5 w-full rounded-sm border border-transparent px-2 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:border-panel-border"
                            onClick={() =>
                              openDialog({
                                kind: "project-rename",
                                projectId: project.id,
                                title: project.title,
                              })
                            }
                          >
                            Rename Project
                          </button>
                          <button
                            type="button"
                            className="module-button w-full rounded-sm border border-transparent px-2 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-[#e89a5b] uppercase hover:border-panel-border"
                            onClick={() =>
                              openDialog({
                                kind: "project-delete",
                                projectId: project.id,
                                title: project.title,
                              })
                            }
                          >
                            Delete Project
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <ul className="ml-3 space-y-0.5 border-l border-panel-border pl-2">
                    {project.documents.length === 0 ? (
                      <li className="px-2 py-1 font-mono text-[10px] text-muted">
                        No documents
                      </li>
                    ) : (
                      project.documents.map((document) => {
                        const isActive =
                          project.id === activeProjectId &&
                          document.id === activeDocumentId;
                        const documentMenuId = `document:${document.id}`;
                        const documentMenuOpen = openMenuId === documentMenuId;

                        return (
                          <li key={document.id}>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectDocument(project.id, document.id)
                                }
                                className={`module-button flex min-w-0 flex-1 items-center justify-between rounded-sm border px-2 py-1.5 text-left ${
                                  isActive
                                    ? "border-accent-soft"
                                    : "border-transparent"
                                }`}
                                data-active={isActive}
                              >
                                <span className="truncate font-mono text-[11px] text-foreground">
                                  {document.title}
                                </span>
                                {isActive ? (
                                  <span className="ml-1 shrink-0 font-mono text-[9px] tracking-widest text-led-blue uppercase">
                                    Open
                                  </span>
                                ) : null}
                              </button>
                              <div
                                className="relative shrink-0"
                                ref={documentMenuOpen ? menuRef : undefined}
                              >
                                <button
                                  type="button"
                                  aria-label={`Document menu for ${document.title}`}
                                  className="module-button rounded-sm border border-transparent px-1 py-1 font-mono text-[9px] tracking-widest text-muted hover:border-panel-border hover:text-foreground"
                                  data-active={documentMenuOpen}
                                  onClick={() =>
                                    setOpenMenuId((current) =>
                                      current === documentMenuId
                                        ? null
                                        : documentMenuId,
                                    )
                                  }
                                >
                                  ···
                                </button>
                                {documentMenuOpen ? (
                                  <div className="absolute top-full right-0 z-20 mt-1 w-40 rounded-sm border border-panel-border bg-panel-raised p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                                    <button
                                      type="button"
                                      className="module-button mb-0.5 w-full rounded-sm border border-transparent px-2 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:border-panel-border"
                                      onClick={() =>
                                        openDialog({
                                          kind: "document-rename",
                                          projectId: project.id,
                                          documentId: document.id,
                                          title: document.title,
                                        })
                                      }
                                    >
                                      Rename Document
                                    </button>
                                    {onOpenVersionHistory ? (
                                      <button
                                        type="button"
                                        className="module-button mb-0.5 w-full rounded-sm border border-transparent px-2 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-foreground uppercase hover:border-panel-border"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          onOpenVersionHistory(document.id);
                                        }}
                                      >
                                        Version History
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="module-button w-full rounded-sm border border-transparent px-2 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-[#e89a5b] uppercase hover:border-panel-border"
                                      onClick={() =>
                                        openDialog({
                                          kind: "document-delete",
                                          projectId: project.id,
                                          documentId: document.id,
                                          title: document.title,
                                        })
                                      }
                                    >
                                      Delete Document
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        );
                      })
                    )}
                    <li>
                      <button
                        type="button"
                        disabled={creatingDoc}
                        onClick={() => void onCreateDocument(project.id)}
                        className="module-button mt-0.5 w-full rounded-sm border border-transparent px-2 py-1 text-left font-mono text-[10px] tracking-[0.12em] text-led-cyan uppercase hover:border-panel-border"
                      >
                        {creatingDoc ? "Creating…" : "+ Document"}
                      </button>
                    </li>
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
                {dialogTitle}
              </p>
              <div className="flex gap-1.5" aria-hidden>
                <span className="panel-screw" />
                <span className="panel-screw" />
              </div>
            </div>

            {isRenameDialog ? (
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
                      void confirmDialog();
                    }
                  }}
                  className="w-full rounded-sm border border-panel-border bg-panel-inset px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-accent-soft"
                />
              </label>
            ) : (
              <p className="mb-3 font-mono text-[11px] leading-relaxed text-foreground">
                Delete{" "}
                <span className="text-led-orange">{dialog.title}</span>
                {dialog.kind === "project-delete"
                  ? "? This removes the project and its documents."
                  : "? This cannot be undone."}
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
                onClick={() => void confirmDialog()}
              >
                {pending ? "Working…" : isRenameDialog ? "Save" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
