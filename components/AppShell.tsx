"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";
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
import { MOCK_PROJECTS } from "@/lib/mock-data";
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

export function AppShell() {
  const [activeProjectId, setActiveProjectId] = useState(MOCK_PROJECTS[0].id);
  const [activeDocumentId, setActiveDocumentId] = useState(
    MOCK_PROJECTS[0].documents[0].id,
  );
  const [document, setDocument] = useState<BlueBookDocument>(createSeedDocument);
  const [activeBlock, setActiveBlock] =
    useState<ActiveBlockState>(DEFAULT_ACTIVE_BLOCK);
  const [editor, setEditor] = useState<Editor | null>(null);

  const activeProject =
    MOCK_PROJECTS.find((project) => project.id === activeProjectId) ??
    MOCK_PROJECTS[0];

  const activeDocument =
    activeProject.documents.find(
      (item) => item.id === activeDocumentId,
    ) ?? activeProject.documents[0];

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
        <ScriptEditor
          document={document}
          documentName={activeDocument.name}
          onDocumentChange={setDocument}
          onActiveBlockChange={setActiveBlock}
          onEditorReady={setEditor}
          activeType={activeBlock.type}
        />
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
        blockCount={document.blocks.length}
      />
    </div>
  );
}
