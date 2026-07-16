import type { ProjectWithDocuments } from "@/types/project";

type SidebarProps = {
  projects: ProjectWithDocuments[];
  activeProjectId: string | null;
  activeDocumentId: string | null;
  onSelectDocument: (projectId: string, documentId: string) => void;
  onCreateProject: () => void;
  creatingProject?: boolean;
};

export function Sidebar({
  projects,
  activeProjectId,
  activeDocumentId,
  onSelectDocument,
  onCreateProject,
  creatingProject = false,
}: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-panel-border bg-panel">
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
              return (
                <li key={project.id}>
                  <div className="mb-1 flex items-center gap-2 px-1">
                    <span
                      className={`led-dot h-1.5 w-1.5 rounded-full ${
                        isProjectActive
                          ? "bg-led-cyan text-led-cyan"
                          : "bg-[#3a3a42] text-transparent"
                      }`}
                      aria-hidden
                    />
                    <p
                      className={`font-mono text-[11px] tracking-[0.08em] uppercase ${
                        isProjectActive ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {project.title}
                    </p>
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
    </aside>
  );
}
