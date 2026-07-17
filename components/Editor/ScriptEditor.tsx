"use client";

import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BlockContextMenu } from "@/components/Blocks/BlockContextMenu";
import {
  BlockEditorProvider,
  type BlockInstanceMenuRequest,
} from "@/components/Editor/BlockEditorContext";
import { EditorToolbar } from "@/components/Toolbar/EditorToolbar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { isRenamableBlockInstance } from "@/lib/blocks/blockRegistry";
import type { BlockDefinition } from "@/lib/blocks/types";
import { documentToTiptap, tiptapToDocument } from "@/lib/document/codec";
import { ScriptBlock } from "@/lib/editor/scriptBlock";
import { UniqueBlockId } from "@/lib/editor/uniqueBlockId";
import type { BlueBookDocument, BlockTypeId } from "@/types/document";

export type ActiveBlockState = {
  id: string;
  type: BlockTypeId;
  content: string;
  font: string;
  size: number;
  exportVisible: boolean;
};

type ScriptEditorProps = {
  document: BlueBookDocument;
  documentName: string;
  blockTypes: BlockDefinition[];
  onDocumentChange: (document: BlueBookDocument) => void;
  onActiveBlockChange: (block: ActiveBlockState) => void;
  onEditorReady: (editor: Editor | null) => void;
  activeType: BlockTypeId;
  onOpenExport?: () => void;
  onOpenStatistics?: () => void;
  onOpenSaveVersion?: () => void;
};

type InstanceDialog =
  | { kind: "rename"; content: string }
  | { kind: "delete"; label: string }
  | null;

function readActiveBlock(editor: Editor): ActiveBlockState | null {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === "scriptBlock") {
      return {
        id: String(node.attrs.id ?? ""),
        type: String(node.attrs.type ?? "action"),
        content: node.textContent ?? "",
        font: node.attrs.style?.font ?? "Courier New",
        size: node.attrs.style?.size ?? 12,
        exportVisible: node.attrs.metadata?.export ?? true,
      };
    }
  }

  return null;
}

export function ScriptEditor({
  document,
  documentName,
  blockTypes,
  onDocumentChange,
  onActiveBlockChange,
  onEditorReady,
  activeType,
  onOpenExport,
  onOpenStatistics,
  onOpenSaveVersion,
}: ScriptEditorProps) {
  const [menu, setMenu] = useState<BlockInstanceMenuRequest | null>(null);
  const [dialog, setDialog] = useState<InstanceDialog>(null);
  const [draftName, setDraftName] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  const labelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const definition of blockTypes) {
      map.set(definition.id, definition.name);
    }
    return map;
  }, [blockTypes]);

  const accentById = useMemo(() => {
    const map = new Map<string, string>();
    for (const definition of blockTypes) {
      map.set(definition.id, definition.editorStyle.accent);
    }
    return map;
  }, [blockTypes]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        link: false,
        underline: false,
      }),
      ScriptBlock,
      UniqueBlockId,
    ],
    content: documentToTiptap(document),
    editorProps: {
      attributes: {
        class: "script-editor-content focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onDocumentChange(
        tiptapToDocument(currentEditor.getJSON(), {
          id: document.id,
          title: document.title,
        }),
      );
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const active = readActiveBlock(currentEditor);
      if (active) {
        onActiveBlockChange(active);
      }
    },
  });

  useEffect(() => {
    onEditorReady(editor);
    return () => onEditorReady(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onEditorReady is setState
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const active = readActiveBlock(editor);
    if (active) {
      onActiveBlockChange(active);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onActiveBlockChange is setState
  }, [editor]);

  const handleOpenBlockMenu = useCallback(
    (request: BlockInstanceMenuRequest) => {
      setMenu(request);
    },
    [],
  );

  const blockEditorValue = useMemo(
    () => ({
      getBlockLabel: (typeId: BlockTypeId) =>
        labelById.get(typeId) ?? typeId,
      getBlockAccent: (typeId: BlockTypeId) =>
        accentById.get(typeId) ?? "var(--muted)",
      onOpenBlockMenu: handleOpenBlockMenu,
    }),
    [accentById, handleOpenBlockMenu, labelById],
  );

  function handleSelectType(type: BlockTypeId) {
    if (!editor) {
      return;
    }

    editor.chain().focus().setScriptBlockType(type).run();
    const active = readActiveBlock(editor);
    if (active) {
      onActiveBlockChange(active);
    }
  }

  function confirmInstanceDialog() {
    if (!editor || !dialog) {
      return;
    }

    if (dialog.kind === "rename") {
      const next = draftName.trim();
      if (!next) {
        setDialogError("Name is required");
        return;
      }
      editor.chain().focus().renameScriptBlockContent(next).run();
      setDialog(null);
      setDialogError(null);
      return;
    }

    editor.chain().focus().deleteScriptBlock().run();
    const active = readActiveBlock(editor);
    if (active) {
      onActiveBlockChange(active);
    }
    setDialog(null);
    setDialogError(null);
  }

  return (
    <BlockEditorProvider value={blockEditorValue}>
      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <EditorToolbar
          activeType={activeType}
          blockTypes={blockTypes}
          onSelectType={handleSelectType}
          onOpenExport={onOpenExport}
          onOpenStatistics={onOpenStatistics}
          onOpenSaveVersion={onOpenSaveVersion}
        />

        <div className="workspace-grid flex flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                Document · {documentName}
              </p>
              <p className="font-mono text-[10px] tracking-[0.16em] text-led-cyan uppercase">
                Structured JSON
              </p>
            </div>

            <div className="rounded-sm border border-panel-border bg-panel/80 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
              <EditorContent editor={editor} />
            </div>

            <p className="mt-4 text-center font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              Right-click or ⋯ · Rename / Delete block
            </p>
          </div>
        </div>

        <BlockContextMenu
          open={menu !== null}
          x={menu?.clientX ?? 0}
          y={menu?.clientY ?? 0}
          canRename={menu ? isRenamableBlockInstance(menu.type) : false}
          onClose={() => setMenu(null)}
          onRename={() => {
            if (!menu) {
              return;
            }
            setDraftName(menu.content);
            setDialogError(null);
            setDialog({ kind: "rename", content: menu.content });
          }}
          onDelete={() => {
            if (!menu) {
              return;
            }
            const label = labelById.get(menu.type) ?? menu.type;
            setDialogError(null);
            setDialog({ kind: "delete", label });
          }}
        />

        <ConfirmDialog
          open={dialog?.kind === "rename"}
          title="Rename Block"
          message="Update the character cue name."
          mode="prompt"
          confirmLabel="Rename"
          promptValue={draftName}
          promptPlaceholder="Character name"
          error={dialogError}
          onPromptChange={setDraftName}
          onConfirm={confirmInstanceDialog}
          onCancel={() => {
            setDialog(null);
            setDialogError(null);
          }}
        />

        <ConfirmDialog
          open={dialog?.kind === "delete"}
          title="Delete Block"
          message={`Permanently delete this ${dialog?.kind === "delete" ? dialog.label : "block"} instance?`}
          confirmLabel="Delete"
          danger
          error={dialogError}
          onConfirm={confirmInstanceDialog}
          onCancel={() => {
            setDialog(null);
            setDialogError(null);
          }}
        />
      </section>
    </BlockEditorProvider>
  );
}
