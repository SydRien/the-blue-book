"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import {
  ScriptEditor,
  type ActiveBlockState,
} from "@/components/Editor/ScriptEditor";
import { AppHeader } from "@/components/Header/AppHeader";
import {
  InspectorPanel,
  type InspectorSettings,
} from "@/components/Inspector/InspectorPanel";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { StatusBar } from "@/components/StatusBar/StatusBar";
import {
  createBlueBookRepository,
  getStorageBackend,
  type SyncStatus,
} from "@/lib/storage";
import {
  createSeedDocument,
  type BlueBookDocument,
} from "@/types/document";
import type { ProjectWithDocuments } from "@/types/project";

const DEFAULT_ACTIVE_BLOCK: ActiveBlockState = {
  type: "dialogue",
  font: "Courier New",
  size: 12,
  exportVisible: true,
};

const SAVE_DEBOUNCE_MS = 400;

export function AppShell() {
  const repositoryRef = useRef(createBlueBookRepository());
  const [projects, setProjects] = useState<ProjectWithDocuments[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [document, setDocument] = useState<BlueBookDocument | null>(null);
  const [activeBlock, setActiveBlock] =
    useState<ActiveBlockState>(DEFAULT_ACTIVE_BLOCK);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [creatingProject, setCreatingProject] = useState(false);
  const skipNextSaveRef = useRef(true);
  const isLocalOnly = getStorageBackend() === "local";

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? null;
  const activeDocumentSummary =
    activeProject?.documents.find((item) => item.id === activeDocumentId) ??
    null;

  async function refreshProjects(
    preferredProjectId?: string | null,
    preferredDocumentId?: string | null,
  ) {
    const repository = repositoryRef.current;
    const listed = await repository.listProjects();

    const withDocuments: ProjectWithDocuments[] = await Promise.all(
      listed.map(async (project) => ({
        ...project,
        documents: await repository.listDocuments(project.id),
      })),
    );

    if (withDocuments.length === 0) {
      const project = await repository.createProject({
        title: "Chengpu Battle VR",
        description: "Personal writing project",
      });
      const created = await repository.createDocument({
        projectId: project.id,
        title: "Script",
        document: createSeedDocument(),
      });
      const refreshed = await repository.listProjects();
      const nextProjects: ProjectWithDocuments[] = await Promise.all(
        refreshed.map(async (item) => ({
          ...item,
          documents: await repository.listDocuments(item.id),
        })),
      );
      setProjects(nextProjects);
      setActiveProjectId(project.id);
      setActiveDocumentId(created.id);
      skipNextSaveRef.current = true;
      setDocument(created);
      setSyncStatus(isLocalOnly ? "local-only" : "synced");
      return;
    }

    setProjects(withDocuments);

    const nextProjectId =
      preferredProjectId &&
      withDocuments.some((project) => project.id === preferredProjectId)
        ? preferredProjectId
        : withDocuments[0].id;

    const nextProject =
      withDocuments.find((project) => project.id === nextProjectId) ??
      withDocuments[0];

    let nextDocumentId =
      preferredDocumentId &&
      nextProject.documents.some((item) => item.id === preferredDocumentId)
        ? preferredDocumentId
        : (nextProject.documents[0]?.id ?? null);

    if (!nextDocumentId) {
      const created = await repository.createDocument({
        projectId: nextProject.id,
        title: "Script",
        document: createSeedDocument(),
      });
      nextDocumentId = created.id;
      const documents = await repository.listDocuments(nextProject.id);
      setProjects((current) =>
        current.map((project) =>
          project.id === nextProject.id ? { ...project, documents } : project,
        ),
      );
      skipNextSaveRef.current = true;
      setDocument(created);
    } else {
      const loaded = await repository.loadDocument(
        nextDocumentId,
        nextProject.id,
      );
      skipNextSaveRef.current = true;
      setDocument(loaded ?? createSeedDocument());
    }

    setActiveProjectId(nextProject.id);
    setActiveDocumentId(nextDocumentId);
    setSyncStatus(isLocalOnly ? "local-only" : "synced");
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setSyncStatus("loading");
      try {
        if (!cancelled) {
          await refreshProjects();
        }
      } catch {
        if (!cancelled) {
          setSyncStatus("sync-error");
          skipNextSaveRef.current = true;
          setDocument(createSeedDocument());
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, []);

  useEffect(() => {
    if (!document || !activeProjectId || !activeDocumentId) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setSyncStatus(isLocalOnly ? "saved-local" : "syncing");
    const timeoutId = window.setTimeout(() => {
      void repositoryRef.current
        .saveDocument({
          projectId: activeProjectId,
          document: {
            ...document,
            id: activeDocumentId,
            title: activeDocumentSummary?.title ?? document.title,
          },
        })
        .then((status) => {
          if (isLocalOnly) {
            setSyncStatus("local-only");
            return;
          }
          setSyncStatus(status === "synced" ? "synced" : "sync-error");
        })
        .catch(() => {
          setSyncStatus(isLocalOnly ? "saved-local" : "sync-error");
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeDocumentId,
    activeDocumentSummary?.title,
    activeProjectId,
    document,
    isLocalOnly,
  ]);

  async function handleSelectDocument(projectId: string, documentId: string) {
    setSyncStatus("loading");
    setActiveProjectId(projectId);
    setActiveDocumentId(documentId);

    try {
      const loaded = await repositoryRef.current.loadDocument(
        documentId,
        projectId,
      );
      skipNextSaveRef.current = true;
      setDocument(loaded ?? createSeedDocument());
      setSyncStatus(isLocalOnly ? "local-only" : "synced");
    } catch {
      skipNextSaveRef.current = true;
      setDocument(createSeedDocument());
      setSyncStatus("sync-error");
    }
  }

  async function handleCreateProject() {
    setCreatingProject(true);
    try {
      const project = await repositoryRef.current.createProject({
        title: `Project ${projects.length + 1}`,
      });
      const created = await repositoryRef.current.createDocument({
        projectId: project.id,
        title: "Script",
        document: createSeedDocument(),
      });
      await refreshProjects(project.id, created.id);
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleRenameProject(projectId: string, title: string) {
    await repositoryRef.current.updateProject({ projectId, title });
    await refreshProjects(activeProjectId, activeDocumentId);
  }

  async function handleDeleteProject(projectId: string) {
    const remaining = projects.filter((project) => project.id !== projectId);
    const nextProject = remaining[0] ?? null;
    const nextDocumentId = nextProject?.documents[0]?.id ?? null;

    await repositoryRef.current.deleteProject(projectId);

    if (activeProjectId === projectId) {
      skipNextSaveRef.current = true;
      setDocument(null);
      setActiveProjectId(null);
      setActiveDocumentId(null);
    }

    await refreshProjects(nextProject?.id ?? null, nextDocumentId);
  }

  function handleInspectorChange(next: InspectorSettings) {
    setActiveBlock({
      type: next.type,
      font: next.font,
      size: next.size,
      exportVisible: next.exportVisible,
    });

    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .updateScriptBlockAttrs({
        type: next.type,
        style: {
          font: next.font,
          size: next.size,
        },
        metadata: {
          export: next.exportVisible,
        },
      })
      .run();
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        projectName={activeProject?.title ?? "No Project"}
        documentName={activeDocumentSummary?.title ?? document?.title ?? "—"}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          activeDocumentId={activeDocumentId}
          onSelectDocument={handleSelectDocument}
          onCreateProject={handleCreateProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          creatingProject={creatingProject}
        />
        {document && activeDocumentId ? (
          <ScriptEditor
            key={activeDocumentId}
            document={document}
            documentName={activeDocumentSummary?.title ?? document.title}
            onDocumentChange={setDocument}
            onActiveBlockChange={setActiveBlock}
            onEditorReady={setEditor}
            activeType={activeBlock.type}
          />
        ) : (
          <section className="flex min-w-0 flex-1 items-center justify-center bg-background">
            <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">
              Loading document…
            </p>
          </section>
        )}
        <InspectorPanel
          settings={{
            type: activeBlock.type,
            font: activeBlock.font,
            size: activeBlock.size,
            exportVisible: activeBlock.exportVisible,
          }}
          onChange={handleInspectorChange}
        />
      </div>
      <StatusBar
        projectName={activeProject?.title ?? "No Project"}
        documentName={activeDocumentSummary?.title ?? document?.title ?? "—"}
        activeType={activeBlock.type}
        exportVisible={activeBlock.exportVisible}
        blockCount={document?.blocks.length ?? 0}
        syncStatus={syncStatus}
      />
    </div>
  );
}
