"use client";

import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { EditorToolbar } from "@/components/Toolbar/EditorToolbar";
import { documentToTiptap, tiptapToDocument } from "@/lib/document/codec";
import { ScriptBlock } from "@/lib/editor/scriptBlock";
import { UniqueBlockId } from "@/lib/editor/uniqueBlockId";
import type { BlueBookDocument, ScriptBlockType } from "@/types/document";

export type ActiveBlockState = {
  type: ScriptBlockType;
  font: string;
  size: number;
  exportVisible: boolean;
};

type ScriptEditorProps = {
  document: BlueBookDocument;
  documentName: string;
  onDocumentChange: (document: BlueBookDocument) => void;
  onActiveBlockChange: (block: ActiveBlockState) => void;
  onEditorReady: (editor: Editor | null) => void;
  activeType: ScriptBlockType;
};

function readActiveBlock(editor: Editor): ActiveBlockState | null {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === "scriptBlock") {
      return {
        type: node.attrs.type as ScriptBlockType,
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
  onDocumentChange,
  onActiveBlockChange,
  onEditorReady,
  activeType,
}: ScriptEditorProps) {
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
    // Parent passes a stable setter; sync only when the editor instance changes.
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

  function handleSelectType(type: ScriptBlockType) {
    if (!editor) {
      return;
    }

    editor.chain().focus().setScriptBlockType(type).run();
    const active = readActiveBlock(editor);
    if (active) {
      onActiveBlockChange(active);
    }
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-background">
      <EditorToolbar activeType={activeType} onSelectType={handleSelectType} />

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
            Editable TipTap document · Manual block types only
          </p>
        </div>
      </div>
    </section>
  );
}
