"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScriptEditor,
  type ActiveBlockState,
} from "@/components/Editor/ScriptEditor";
import { AppHeader } from "@/components/Header/AppHeader";
import {
  InspectorPanel,
  type InspectorSettings,
} from "@/components/Inspector/InspectorPanel";
import { ExportPanel } from "@/components/Export/ExportPanel";
import { StatisticsPanel } from "@/components/Statistics/StatisticsPanel";
import { CharacterInspector } from "@/components/Characters/CharacterInspector";
import { CharactersPanel } from "@/components/Characters/CharactersPanel";
import { OutlinePanel } from "@/components/Outline/OutlinePanel";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { ScratchpadPanel } from "@/components/Scratchpad/ScratchpadPanel";
import { JonPanel } from "@/components/Companion/JonPanel";
import { StatusBar } from "@/components/StatusBar/StatusBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VersionHistoryPanel } from "@/components/VersionHistory/VersionHistoryPanel";
import {
  LeftRail,
  type LeftRailTab,
} from "@/components/Workspace/LeftRail";
import { RightSidebarLayout } from "@/components/Layout/RightSidebarLayout";
import { WorkspaceLayout } from "@/components/Layout/WorkspaceLayout";
import {
  countBlocksOfType,
  createCustomBlockType,
  deleteCustomBlockType,
  listAllBlockDefinitions,
  renameCustomBlockType,
} from "@/lib/blocks/blockTypeEntities";
import type { BlockDefinition } from "@/lib/blocks/types";
import { getCharacterManager } from "@/lib/entities/characters/characterManager";
import { findCharacterForBlock } from "@/lib/entities/characters/characterUtils";
import type { CharacterRecord } from "@/lib/entities/characters/types";
import { getNoteManager } from "@/lib/notes/noteManager";
import type { Note, NoteType } from "@/lib/notes/types";
import type { OutlineNode } from "@/lib/outline/types";
import { scrollEditorToBlock } from "@/lib/outline/scrollToBlock";
import {
  createBlueBookRepository,
  getStorageBackend,
  type SyncStatus,
} from "@/lib/storage";
import type { DocumentSyncStatus } from "@/lib/storage/documentSyncStatus";
import { getVersionManager } from "@/lib/versionHistory/versionManager";
import type { DocumentVersion } from "@/lib/versionHistory/types";
import {
  createSeedDocument,
  type BlueBookDocument,
} from "@/types/document";
import type { ProjectWithDocuments } from "@/types/project";

const DEFAULT_ACTIVE_BLOCK: ActiveBlockState = {
  id: "",
  type: "dialogue",
  content: "",
  font: "Courier New",
  size: 12,
  exportVisible: true,
};

const SAVE_DEBOUNCE_MS = 400;

type BlockTypeDialog =
  | { kind: "create" }
  | { kind: "rename"; definition: BlockDefinition }
  | { kind: "delete"; definition: BlockDefinition; usageCount: number }
  | null;

type CharacterDialog =
  | { kind: "create" }
  | { kind: "rename"; character: CharacterRecord }
  | { kind: "delete"; character: CharacterRecord }
  | null;

type NoteDialog =
  | { kind: "create" }
  | { kind: "rename"; note: Note }
  | { kind: "delete"; note: Note }
  | null;

type VersionDialog =
  | { kind: "create" }
  | { kind: "restore"; version: DocumentVersion }
  | { kind: "delete"; version: DocumentVersion }
  | null;

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
  const [documentSyncById, setDocumentSyncById] = useState<
    Record<string, DocumentSyncStatus>
  >({});
  const [noteSyncById, setNoteSyncById] = useState<
    Record<string, DocumentSyncStatus>
  >(() => {
    const initial: Record<string, DocumentSyncStatus> = {};
    for (const note of getNoteManager().list()) {
      initial[note.id] = "synced";
    }
    return initial;
  });
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingDocumentId, setCreatingDocumentId] = useState<string | null>(
    null,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const [leftRailTab, setLeftRailTab] = useState<LeftRailTab>("projects");
  const [selectedOutlineBlockId, setSelectedOutlineBlockId] = useState<
    string | null
  >(null);
  const [blockTypes, setBlockTypes] = useState<BlockDefinition[]>(() =>
    listAllBlockDefinitions(),
  );
  const [blockTypeDialog, setBlockTypeDialog] = useState<BlockTypeDialog>(null);
  const [blockTypeDraft, setBlockTypeDraft] = useState("");
  const [blockTypeError, setBlockTypeError] = useState<string | null>(null);
  const [blockTypePending, setBlockTypePending] = useState(false);
  const [characters, setCharacters] = useState<CharacterRecord[]>(() =>
    getCharacterManager().list(),
  );
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [characterDialog, setCharacterDialog] =
    useState<CharacterDialog>(null);
  const [characterDraft, setCharacterDraft] = useState("");
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>(() => getNoteManager().list());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteDialog, setNoteDialog] = useState<NoteDialog>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [versionDialog, setVersionDialog] = useState<VersionDialog>(null);
  const [versionDraft, setVersionDraft] = useState("");
  const [versionError, setVersionError] = useState<string | null>(null);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const skipNextSaveRef = useRef(true);
  const noteSyncChainRef = useRef<Promise<void>>(Promise.resolve());
  const isLocalOnly = getStorageBackend() === "local";

  const refreshBlockTypes = useCallback(() => {
    setBlockTypes(listAllBlockDefinitions());
  }, []);

  const refreshCharacters = useCallback(() => {
    setCharacters(getCharacterManager().list());
  }, []);

  const refreshNotes = useCallback(() => {
    setNotes(getNoteManager().list());
  }, []);

  const markNoteSync = useCallback(
    (noteId: string, status: DocumentSyncStatus) => {
      setNoteSyncById((current) => {
        if (current[noteId] === status) {
          return current;
        }
        return { ...current, [noteId]: status };
      });
    },
    [],
  );

  const seedNoteSync = useCallback((listed: Note[]) => {
    setNoteSyncById((current) => {
      const next = { ...current };
      for (const note of listed) {
        if (!(note.id in next)) {
          next[note.id] = "synced";
        }
      }
      return next;
    });
  }, []);

  const syncNoteToCloud = useCallback(
    (note: Note) => {
      markNoteSync(note.id, "dirty");
      noteSyncChainRef.current = noteSyncChainRef.current
        .catch(() => undefined)
        .then(async () => {
          markNoteSync(note.id, "syncing");
          try {
            // Always sync the newest local row for this id (avoids races between
            // create-sync and save-to-project-sync wiping projectId).
            const latest = getNoteManager().get(note.id) ?? note;
            await repositoryRef.current.upsertNote(latest);
            refreshNotes();
            markNoteSync(note.id, "synced");
          } catch {
            // Local note already saved; cloud catch-up is best-effort.
            markNoteSync(note.id, "dirty");
          }
        });
    },
    [markNoteSync, refreshNotes],
  );

  const syncDeleteNoteToCloud = useCallback((noteId: string) => {
    noteSyncChainRef.current = noteSyncChainRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await repositoryRef.current.deleteNote(noteId);
        } catch {
          // Local delete already applied.
        }
      });
  }, []);

  const hydrateNotesFromCloud = useCallback(async () => {
    try {
      const listed = await repositoryRef.current.listNotes();
      setNotes(listed);
      seedNoteSync(listed);
    } catch {
      const listed = getNoteManager().list();
      setNotes(listed);
      seedNoteSync(listed);
    }
  }, [seedNoteSync]);

  const refreshVersions = useCallback((documentId: string | null) => {
    if (!documentId) {
      setVersions([]);
      return;
    }
    setVersions(getVersionManager().list(documentId));
  }, []);

  const selectedCharacter = useMemo(
    () =>
      selectedCharacterId
        ? (characters.find((item) => item.id === selectedCharacterId) ?? null)
        : null,
    [characters, selectedCharacterId],
  );

  const latestVersionLabel = versions[0]?.label ?? null;

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? null;
  const activeDocumentSummary =
    activeProject?.documents.find((item) => item.id === activeDocumentId) ??
    null;
  const jonProjectNotes = useMemo(() => {
    if (!activeProjectId) {
      return [];
    }
    return notes
      .filter((note) => note.projectId === activeProjectId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);
  }, [notes, activeProjectId]);

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
        title: "Project 1",
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
      seedDocumentSync(nextProjects);
      setActiveProjectId(project.id);
      setActiveDocumentId(created.id);
      skipNextSaveRef.current = true;
      setDocument(created);
      setSyncStatus(isLocalOnly ? "saved-local" : "synced");
      markDocumentSync(created.id, "synced");
      await hydrateNotesFromCloud();
      return;
    }

    setProjects(withDocuments);
    seedDocumentSync(withDocuments);

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
      markDocumentSync(created.id, "synced");
    } else {
      const loaded = await repository.loadDocument(
        nextDocumentId,
        nextProject.id,
      );
      skipNextSaveRef.current = true;
      setDocument(loaded ?? createSeedDocument());
      markDocumentSync(nextDocumentId, "synced");
    }

    setActiveProjectId(nextProject.id);
    setActiveDocumentId(nextDocumentId);
    setSyncStatus(isLocalOnly ? "saved-local" : "synced");
    await hydrateNotesFromCloud();
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

  function markDocumentSync(
    documentId: string,
    status: DocumentSyncStatus,
  ) {
    setDocumentSyncById((current) => {
      if (current[documentId] === status) {
        return current;
      }
      return { ...current, [documentId]: status };
    });
  }

  function seedDocumentSync(nextProjects: ProjectWithDocuments[]) {
    setDocumentSyncById((current) => {
      const next = { ...current };
      for (const project of nextProjects) {
        for (const item of project.documents) {
          if (!(item.id in next)) {
            next[item.id] = "synced";
          }
        }
      }
      return next;
    });
  }

  useEffect(() => {
    if (!document || !activeProjectId || !activeDocumentId) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      markDocumentSync(activeDocumentId, "synced");
      return;
    }

    markDocumentSync(activeDocumentId, "dirty");
    setSyncStatus(isLocalOnly ? "saved-local" : "syncing");
    const timeoutId = window.setTimeout(() => {
      markDocumentSync(activeDocumentId, "syncing");
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
            setSyncStatus("saved-local");
            markDocumentSync(activeDocumentId, "synced");
            return;
          }
          const ok = status === "synced";
          setSyncStatus(ok ? "synced" : "sync-error");
          markDocumentSync(activeDocumentId, ok ? "synced" : "dirty");
        })
        .catch(() => {
          setSyncStatus(isLocalOnly ? "saved-local" : "sync-error");
          markDocumentSync(
            activeDocumentId,
            isLocalOnly ? "synced" : "dirty",
          );
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
    setSelectedOutlineBlockId(null);
    setSelectedCharacterId(null);
    refreshVersions(documentId);

    try {
      const loaded = await repositoryRef.current.loadDocument(
        documentId,
        projectId,
      );
      skipNextSaveRef.current = true;
      setDocument(loaded ?? createSeedDocument());
      setEditorEpoch((value) => value + 1);
      setSyncStatus(isLocalOnly ? "saved-local" : "synced");
      markDocumentSync(documentId, "synced");
    } catch {
      skipNextSaveRef.current = true;
      setDocument(createSeedDocument());
      setEditorEpoch((value) => value + 1);
      setSyncStatus("sync-error");
      markDocumentSync(documentId, "dirty");
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

  async function handleCreateDocument(projectId: string) {
    setCreatingDocumentId(projectId);
    try {
      const project = projects.find((item) => item.id === projectId);
      const created = await repositoryRef.current.createDocument({
        projectId,
        title: `Document ${(project?.documents.length ?? 0) + 1}`,
        document: createSeedDocument(),
      });
      await refreshProjects(projectId, created.id);
    } finally {
      setCreatingDocumentId(null);
    }
  }

  async function handleRenameDocument(documentId: string, title: string) {
    await repositoryRef.current.updateDocument({ documentId, title });
    if (document && document.id === documentId) {
      skipNextSaveRef.current = true;
      setDocument({ ...document, title });
    }
    await refreshProjects(activeProjectId, activeDocumentId);
  }

  async function handleDeleteDocument(documentId: string) {
    const owner = projects.find((project) =>
      project.documents.some((item) => item.id === documentId),
    );
    if (!owner) {
      return;
    }

    const remainingDocs = owner.documents.filter(
      (item) => item.id !== documentId,
    );
    const nextDocumentId = remainingDocs[0]?.id ?? null;

    await repositoryRef.current.deleteDocument(documentId);

    if (activeDocumentId === documentId) {
      skipNextSaveRef.current = true;
      setDocument(null);
      setActiveDocumentId(null);
    }

    // Empty project: refreshProjects will create a default Script document.
    await refreshProjects(owner.id, nextDocumentId);
  }

  function handleInspectorChange(next: InspectorSettings) {
    setActiveBlock((current) => ({
      ...current,
      type: next.type,
      font: next.font,
      size: next.size,
      exportVisible: next.exportVisible,
    }));

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

  function reassignBlockTypeInEditor(fromType: string, toType: string) {
    if (!editor) {
      return;
    }

    const { state } = editor;
    const { tr } = state;
    let modified = false;

    state.doc.descendants((node, pos) => {
      if (node.type.name === "scriptBlock" && node.attrs.type === fromType) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          type: toType,
        });
        modified = true;
      }
    });

    if (modified) {
      editor.view.dispatch(tr);
    }
  }

  function openCreateBlockType() {
    setBlockTypeDraft("Camera Note");
    setBlockTypeError(null);
    setBlockTypeDialog({ kind: "create" });
  }

  function openRenameBlockType(definition: BlockDefinition) {
    setBlockTypeDraft(definition.name);
    setBlockTypeError(null);
    setBlockTypeDialog({ kind: "rename", definition });
  }

  function openDeleteBlockType(definition: BlockDefinition) {
    const usageCount = countBlocksOfType(
      document?.blocks ?? [],
      definition.id,
    );
    setBlockTypeError(null);
    setBlockTypeDialog({ kind: "delete", definition, usageCount });
  }

  function confirmBlockTypeDialog() {
    if (!blockTypeDialog) {
      return;
    }

    setBlockTypePending(true);
    setBlockTypeError(null);

    try {
      switch (blockTypeDialog.kind) {
        case "create": {
          const name = blockTypeDraft.trim();
          if (!name) {
            setBlockTypeError("Name is required");
            return;
          }
          createCustomBlockType(name);
          refreshBlockTypes();
          break;
        }
        case "rename": {
          const name = blockTypeDraft.trim();
          if (!name) {
            setBlockTypeError("Name is required");
            return;
          }
          renameCustomBlockType(blockTypeDialog.definition.id, name);
          refreshBlockTypes();
          break;
        }
        case "delete": {
          const { definition } = blockTypeDialog;
          reassignBlockTypeInEditor(definition.id, "action");
          if (document) {
            setDocument({
              ...document,
              blocks: document.blocks.map((block) =>
                block.type === definition.id
                  ? { ...block, type: "action" }
                  : block,
              ),
            });
          }
          if (activeBlock.type === definition.id) {
            setActiveBlock((current) => ({ ...current, type: "action" }));
          }
          deleteCustomBlockType(definition.id);
          refreshBlockTypes();
          break;
        }
      }
      setBlockTypeDialog(null);
    } catch (error) {
      setBlockTypeError(
        error instanceof Error ? error.message : "Operation failed",
      );
    } finally {
      setBlockTypePending(false);
    }
  }

  function handleOutlineSelect(node: OutlineNode) {
    setSelectedOutlineBlockId(node.sourceBlockId);
    setSelectedCharacterId(null);
    scrollEditorToBlock(editor, node.sourceBlockId);
  }

  function confirmCharacterDialog() {
    if (!characterDialog) {
      return;
    }
    setCharacterError(null);
    const manager = getCharacterManager();

    try {
      switch (characterDialog.kind) {
        case "create": {
          const name = characterDraft.trim();
          if (!name) {
            setCharacterError("Name is required");
            return;
          }
          const created = manager.create({ name });
          refreshCharacters();
          setSelectedCharacterId(created.id);
          setLeftRailTab("characters");
          break;
        }
        case "rename": {
          const name = characterDraft.trim();
          if (!name) {
            setCharacterError("Name is required");
            return;
          }
          manager.rename(characterDialog.character.id, name);
          refreshCharacters();
          break;
        }
        case "delete": {
          manager.delete(characterDialog.character.id);
          if (selectedCharacterId === characterDialog.character.id) {
            setSelectedCharacterId(null);
          }
          refreshCharacters();
          break;
        }
      }
      setCharacterDialog(null);
    } catch (error) {
      setCharacterError(
        error instanceof Error ? error.message : "Operation failed",
      );
    }
  }

  function handleCharacterFieldChange(patch: Partial<CharacterRecord>) {
    if (!selectedCharacterId) {
      return;
    }
    const manager = getCharacterManager();
    if (patch.name !== undefined) {
      manager.rename(selectedCharacterId, patch.name);
    }
    manager.update(selectedCharacterId, {
      role: patch.role,
      description: patch.description,
      notes: patch.notes,
      color: patch.color,
      aliases: patch.aliases,
    });
    refreshCharacters();
  }

  function confirmNoteDialog() {
    if (!noteDialog) {
      return;
    }
    setNoteError(null);
    const manager = getNoteManager();

    try {
      switch (noteDialog.kind) {
        case "create": {
          const title = noteDraft.trim();
          if (!title) {
            setNoteError("Title is required");
            return;
          }
          const created = manager.create({ title, type: "idea" });
          refreshNotes();
          setSelectedNoteId(created.id);
          syncNoteToCloud(created);
          break;
        }
        case "rename": {
          const title = noteDraft.trim();
          if (!title) {
            setNoteError("Title is required");
            return;
          }
          const renamed = manager.rename(noteDialog.note.id, title);
          refreshNotes();
          syncNoteToCloud(renamed);
          break;
        }
        case "delete": {
          const deletedId = noteDialog.note.id;
          manager.delete(deletedId);
          if (selectedNoteId === deletedId) {
            setSelectedNoteId(null);
          }
          refreshNotes();
          syncDeleteNoteToCloud(deletedId);
          break;
        }
      }
      setNoteDialog(null);
    } catch (error) {
      setNoteError(
        error instanceof Error ? error.message : "Operation failed",
      );
    }
  }

  function handleNoteContentChange(noteId: string, content: string) {
    const updated = getNoteManager().update(noteId, { content });
    refreshNotes();
    syncNoteToCloud(updated);
  }

  function handleNoteTypeChange(noteId: string, type: NoteType) {
    const updated = getNoteManager().update(noteId, { type });
    refreshNotes();
    syncNoteToCloud(updated);
  }

  function handleSaveNoteToProject(note: Note) {
    if (!activeProjectId) {
      return;
    }
    const updated = getNoteManager().saveToProject(note.id, activeProjectId);
    refreshNotes();
    syncNoteToCloud(updated);
  }

  function openVersionHistory(documentId: string) {
    if (documentId !== activeDocumentId) {
      return;
    }
    refreshVersions(documentId);
    setVersionHistoryOpen(true);
  }

  function confirmVersionDialog() {
    if (!versionDialog || !document) {
      return;
    }
    setVersionError(null);
    const manager = getVersionManager();

    try {
      switch (versionDialog.kind) {
        case "create": {
          manager.createSnapshot(document, versionDraft.trim() || undefined);
          refreshVersions(document.id);
          break;
        }
        case "restore": {
          const restored = manager.restore(versionDialog.version.id);
          skipNextSaveRef.current = false;
          setDocument(restored);
          setEditorEpoch((value) => value + 1);
          setVersionHistoryOpen(false);
          break;
        }
        case "delete": {
          manager.delete(versionDialog.version.id);
          refreshVersions(document.id);
          break;
        }
      }
      setVersionDialog(null);
    } catch (error) {
      setVersionError(
        error instanceof Error ? error.message : "Operation failed",
      );
    }
  }

  useEffect(() => {
    if (activeDocumentId) {
      refreshVersions(activeDocumentId);
    }
  }, [activeDocumentId, refreshVersions]);

  const linkedForActiveBlock =
    activeBlock.type === "character" && activeBlock.id
      ? findCharacterForBlock(characters, activeBlock.id)
      : null;

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        projectName={activeProject?.title ?? "No Project"}
        documentName={activeDocumentSummary?.title ?? document?.title ?? "—"}
      />
      <WorkspaceLayout
        left={
          <LeftRail
            tab={leftRailTab}
            onTabChange={(tab) => {
              setLeftRailTab(tab);
              if (tab !== "characters") {
                setSelectedCharacterId(null);
              }
            }}
            projects={
              <Sidebar
                embedded
                projects={projects}
                activeProjectId={activeProjectId}
                activeDocumentId={activeDocumentId}
                documentSyncById={documentSyncById}
                noteSyncById={noteSyncById}
                projectNotes={notes}
                onSelectDocument={handleSelectDocument}
                onSelectNote={(note) => {
                  setSelectedNoteId(note.id);
                  setLeftRailTab("projects");
                }}
                onCreateProject={handleCreateProject}
                onCreateDocument={handleCreateDocument}
                onRenameProject={handleRenameProject}
                onDeleteProject={handleDeleteProject}
                onRenameDocument={handleRenameDocument}
                onDeleteDocument={handleDeleteDocument}
                onOpenVersionHistory={openVersionHistory}
                creatingProject={creatingProject}
                creatingDocumentId={creatingDocumentId}
              />
            }
            outline={
              <OutlinePanel
                document={document}
                selectedSourceBlockId={selectedOutlineBlockId}
                onSelectNode={handleOutlineSelect}
              />
            }
            characters={
              <CharactersPanel
                characters={characters}
                selectedId={selectedCharacterId}
                onSelect={(character) => {
                  setSelectedCharacterId(character.id);
                }}
                onCreate={() => {
                  setCharacterDraft("Jin Wen Gong");
                  setCharacterError(null);
                  setCharacterDialog({ kind: "create" });
                }}
                onRename={(character) => {
                  setCharacterDraft(character.name);
                  setCharacterError(null);
                  setCharacterDialog({ kind: "rename", character });
                }}
                onDelete={(character) => {
                  setCharacterError(null);
                  setCharacterDialog({ kind: "delete", character });
                }}
              />
            }
          />
        }
        center={
          document && activeDocumentId ? (
            <ScriptEditor
              key={`${activeDocumentId}-${editorEpoch}`}
              document={document}
              documentName={activeDocumentSummary?.title ?? document.title}
              blockTypes={blockTypes}
              onDocumentChange={setDocument}
              onActiveBlockChange={setActiveBlock}
              onEditorReady={setEditor}
              activeType={activeBlock.type}
              onOpenExport={() => setExportOpen(true)}
              onOpenStatistics={() => setStatisticsOpen(true)}
              onOpenSaveVersion={() => {
                setVersionDraft("");
                setVersionError(null);
                setVersionDialog({ kind: "create" });
              }}
            />
          ) : (
            <section className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-background">
              <div className="max-w-sm px-6 text-center">
                <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">
                  {syncStatus === "loading"
                    ? "Loading document…"
                    : "No document open"}
                </p>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">
                  Select a document in the sidebar, or create one with +
                  Document.
                </p>
              </div>
            </section>
          )
        }
        right={
          <RightSidebarLayout
            inspector={
              selectedCharacter ? (
                <CharacterInspector
                  character={selectedCharacter}
                  document={document}
                  onChange={handleCharacterFieldChange}
                  onJumpToBlock={(blockId) => {
                    scrollEditorToBlock(editor, blockId);
                  }}
                  onClose={() => setSelectedCharacterId(null)}
                />
              ) : (
                <InspectorPanel
                  settings={{
                    type: activeBlock.type,
                    font: activeBlock.font,
                    size: activeBlock.size,
                    exportVisible: activeBlock.exportVisible,
                  }}
                  blockTypes={blockTypes}
                  onChange={handleInspectorChange}
                  onCreateBlockType={openCreateBlockType}
                  onRenameBlockType={openRenameBlockType}
                  onDeleteBlockType={openDeleteBlockType}
                  entityLink={
                    activeBlock.type === "character" && activeBlock.id
                      ? {
                          blockId: activeBlock.id,
                          cueText: activeBlock.content,
                          linked: linkedForActiveBlock,
                          characters,
                          onCreateFromCue: () => {
                            const name =
                              activeBlock.content.trim() || "New Character";
                            const created = getCharacterManager().create({
                              name,
                            });
                            getCharacterManager().linkBlock(
                              created.id,
                              activeBlock.id,
                            );
                            refreshCharacters();
                            setSelectedCharacterId(created.id);
                            setLeftRailTab("characters");
                          },
                          onLink: (characterId) => {
                            getCharacterManager().linkBlock(
                              characterId,
                              activeBlock.id,
                            );
                            refreshCharacters();
                          },
                          onUnlink: () => {
                            if (!linkedForActiveBlock) {
                              return;
                            }
                            getCharacterManager().unlinkBlock(
                              linkedForActiveBlock.id,
                              activeBlock.id,
                            );
                            refreshCharacters();
                          },
                        }
                      : null
                  }
                />
              )
            }
            scratchpad={
              <ScratchpadPanel
                notes={notes}
                selectedId={selectedNoteId}
                activeProjectId={activeProjectId}
                activeProjectTitle={activeProject?.title}
                onSelect={(note) => setSelectedNoteId(note.id)}
                onCreate={() => {
                  setNoteDraft("Untitled idea");
                  setNoteError(null);
                  setNoteDialog({ kind: "create" });
                }}
                onRename={(note) => {
                  setNoteDraft(note.title);
                  setNoteError(null);
                  setNoteDialog({ kind: "rename", note });
                }}
                onDelete={(note) => {
                  setNoteError(null);
                  setNoteDialog({ kind: "delete", note });
                }}
                onChangeContent={handleNoteContentChange}
                onChangeType={handleNoteTypeChange}
                onSaveToProject={handleSaveNoteToProject}
              />
            }
            jon={
              <JonPanel
                project={
                  activeProject
                    ? {
                        title: activeProject.title,
                        description: activeProject.description,
                      }
                    : null
                }
                document={document}
                activeBlock={
                  activeBlock.id
                    ? {
                        id: activeBlock.id,
                        type: activeBlock.type,
                        content: activeBlock.content,
                      }
                    : null
                }
                notes={jonProjectNotes}
              />
            }
          />
        }
      />
      <StatusBar
        projectName={activeProject?.title ?? "No Project"}
        documentName={activeDocumentSummary?.title ?? document?.title ?? "—"}
        activeType={activeBlock.type}
        exportVisible={activeBlock.exportVisible}
        blockCount={document?.blocks.length ?? 0}
        syncStatus={syncStatus}
        latestVersionLabel={latestVersionLabel}
      />
      {document ? (
        <>
          <ExportPanel
            document={document}
            open={exportOpen}
            onClose={() => setExportOpen(false)}
          />
          <StatisticsPanel
            document={document}
            open={statisticsOpen}
            onClose={() => setStatisticsOpen(false)}
          />
          <VersionHistoryPanel
            open={versionHistoryOpen}
            documentTitle={activeDocumentSummary?.title ?? document.title}
            versions={versions}
            onClose={() => setVersionHistoryOpen(false)}
            onCreateSnapshot={() => {
              setVersionDraft("");
              setVersionError(null);
              setVersionDialog({ kind: "create" });
            }}
            onRestore={(version) => {
              setVersionError(null);
              setVersionDialog({ kind: "restore", version });
            }}
            onDelete={(version) => {
              setVersionError(null);
              setVersionDialog({ kind: "delete", version });
            }}
          />
        </>
      ) : null}

      <ConfirmDialog
        open={blockTypeDialog?.kind === "create"}
        title="New Block Type"
        message="Create a custom narrative block type."
        mode="prompt"
        confirmLabel="Create"
        promptValue={blockTypeDraft}
        promptPlaceholder="Camera Note"
        pending={blockTypePending}
        error={blockTypeError}
        onPromptChange={setBlockTypeDraft}
        onConfirm={confirmBlockTypeDialog}
        onCancel={() => setBlockTypeDialog(null)}
      />

      <ConfirmDialog
        open={blockTypeDialog?.kind === "rename"}
        title="Rename Block Type"
        message="Update the display name for this custom type."
        mode="prompt"
        confirmLabel="Rename"
        promptValue={blockTypeDraft}
        pending={blockTypePending}
        error={blockTypeError}
        onPromptChange={setBlockTypeDraft}
        onConfirm={confirmBlockTypeDialog}
        onCancel={() => setBlockTypeDialog(null)}
      />

      <ConfirmDialog
        open={blockTypeDialog?.kind === "delete"}
        title="Delete Block Type"
        message={
          blockTypeDialog?.kind === "delete"
            ? blockTypeDialog.usageCount > 0
              ? `Delete “${blockTypeDialog.definition.name}”? ${blockTypeDialog.usageCount} block(s) will become Action.`
              : `Permanently delete “${blockTypeDialog.definition.name}”?`
            : ""
        }
        confirmLabel="Delete"
        danger
        pending={blockTypePending}
        error={blockTypeError}
        onConfirm={confirmBlockTypeDialog}
        onCancel={() => setBlockTypeDialog(null)}
      />

      <ConfirmDialog
        open={characterDialog?.kind === "create"}
        title="New Character"
        message="Create a character entity."
        mode="prompt"
        confirmLabel="Create"
        promptValue={characterDraft}
        promptPlaceholder="Jin Wen Gong"
        error={characterError}
        onPromptChange={setCharacterDraft}
        onConfirm={confirmCharacterDialog}
        onCancel={() => setCharacterDialog(null)}
      />

      <ConfirmDialog
        open={characterDialog?.kind === "rename"}
        title="Rename Character"
        message="Update the character name."
        mode="prompt"
        confirmLabel="Rename"
        promptValue={characterDraft}
        error={characterError}
        onPromptChange={setCharacterDraft}
        onConfirm={confirmCharacterDialog}
        onCancel={() => setCharacterDialog(null)}
      />

      <ConfirmDialog
        open={characterDialog?.kind === "delete"}
        title="Delete Character"
        message={
          characterDialog?.kind === "delete"
            ? `Permanently delete “${characterDialog.character.name}”? Links will be removed.`
            : ""
        }
        confirmLabel="Delete"
        danger
        error={characterError}
        onConfirm={confirmCharacterDialog}
        onCancel={() => setCharacterDialog(null)}
      />

      <ConfirmDialog
        open={noteDialog?.kind === "create"}
        title="New Note"
        message="Create a scratchpad note."
        mode="prompt"
        confirmLabel="Create"
        promptValue={noteDraft}
        promptPlaceholder="Untitled idea"
        error={noteError}
        onPromptChange={setNoteDraft}
        onConfirm={confirmNoteDialog}
        onCancel={() => setNoteDialog(null)}
      />

      <ConfirmDialog
        open={noteDialog?.kind === "rename"}
        title="Rename Note"
        message="Update the note title."
        mode="prompt"
        confirmLabel="Rename"
        promptValue={noteDraft}
        error={noteError}
        onPromptChange={setNoteDraft}
        onConfirm={confirmNoteDialog}
        onCancel={() => setNoteDialog(null)}
      />

      <ConfirmDialog
        open={noteDialog?.kind === "delete"}
        title="Delete Note"
        message={
          noteDialog?.kind === "delete"
            ? `Permanently delete “${noteDialog.note.title}”?`
            : ""
        }
        confirmLabel="Delete"
        danger
        error={noteError}
        onConfirm={confirmNoteDialog}
        onCancel={() => setNoteDialog(null)}
      />

      <ConfirmDialog
        open={versionDialog?.kind === "create"}
        title="Save Version"
        message="Optional label for this snapshot."
        mode="prompt"
        confirmLabel="Save"
        promptValue={versionDraft}
        promptPlaceholder="Final dialogue revision"
        error={versionError}
        onPromptChange={setVersionDraft}
        onConfirm={confirmVersionDialog}
        onCancel={() => setVersionDialog(null)}
      />

      <ConfirmDialog
        open={versionDialog?.kind === "restore"}
        title="Restore Version"
        message={
          versionDialog?.kind === "restore"
            ? `Restore “${versionDialog.version.label}”? Current unsaved editor state will be replaced (auto-save will follow).`
            : ""
        }
        confirmLabel="Restore"
        danger
        error={versionError}
        onConfirm={confirmVersionDialog}
        onCancel={() => setVersionDialog(null)}
      />

      <ConfirmDialog
        open={versionDialog?.kind === "delete"}
        title="Delete Version"
        message={
          versionDialog?.kind === "delete"
            ? `Permanently delete snapshot “${versionDialog.version.label}”?`
            : ""
        }
        confirmLabel="Delete"
        danger
        error={versionError}
        onConfirm={confirmVersionDialog}
        onCancel={() => setVersionDialog(null)}
      />
    </div>
  );
}
