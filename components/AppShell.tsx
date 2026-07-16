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
import {
  StatusBar,
  type SaveStatus,
} from "@/components/StatusBar/StatusBar";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { createDocumentStorage } from "@/lib/storage";
import {
  createSeedDocument,
  type BlueBookDocument,
} from "@/types/document";

const DEFAULT_ACTIVE_BLOCK: ActiveBlockState = {
  type: "dialogue",
  font: "Courier New",
  size: 12,
  exportVisible: true,
};

const SAVE_DEBOUNCE_MS = 300;

export function AppShell() {
  const storageRef = useRef(createDocumentStorage());
  const [activeProjectId, setActiveProjectId] = useState(MOCK_PROJECTS[0].id);
  const [activeDocumentId, setActiveDocumentId] = useState(
    MOCK_PROJECTS[0].documents[0].id,
  );
  const [document, setDocument] = useState<BlueBookDocument | null>(null);
  const [activeBlock, setActiveBlock] =
    useState<ActiveBlockState>(DEFAULT_ACTIVE_BLOCK);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const skipNextSaveRef = useRef(true);

  const activeProject =
    MOCK_PROJECTS.find((project) => project.id === activeProjectId) ??
    MOCK_PROJECTS[0];

  const activeDocument =
    activeProject.documents.find(
      (item) => item.id === activeDocumentId,
    ) ?? activeProject.documents[0];

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      setSaveStatus("loading");
      const stored = await storageRef.current.load();
      if (cancelled) {
        return;
      }

      skipNextSaveRef.current = true;
      setDocument(stored ?? createSeedDocument());
      setSaveStatus("saved");
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!document) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setSaveStatus("saving");
    const timeoutId = window.setTimeout(() => {
      void storageRef.current
        .save(document)
        .then(() => {
          setSaveStatus("saved");
        })
        .catch(() => {
          setSaveStatus("error");
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [document]);

  function handleSelectDocument(projectId: string, documentId: string) {
    setActiveProjectId(projectId);
    setActiveDocumentId(documentId);
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
        projectName={activeProject.name}
        documentName={activeDocument.name}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          projects={MOCK_PROJECTS}
          activeProjectId={activeProjectId}
          activeDocumentId={activeDocumentId}
          onSelectDocument={handleSelectDocument}
        />
        {document ? (
          <ScriptEditor
            document={document}
            documentName={activeDocument.name}
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
        projectName={activeProject.name}
        documentName={activeDocument.name}
        activeType={activeBlock.type}
        exportVisible={activeBlock.exportVisible}
        blockCount={document?.blocks.length ?? 0}
        saveStatus={saveStatus}
      />
    </div>
  );
}
