"use client";

import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { useBlockEditorContext } from "@/components/Editor/BlockEditorContext";
import { DEFAULT_BLOCK_STYLE, type BlockStyle } from "@/types/document";

function isContinuationOfSameType(
  editor: NodeViewProps["editor"],
  getPos: NodeViewProps["getPos"],
  type: string,
): boolean {
  const pos = getPos();
  if (typeof pos !== "number") {
    return false;
  }
  const $pos = editor.state.doc.resolve(pos);
  const index = $pos.index($pos.depth);
  if (index <= 0) {
    return false;
  }
  const previous = $pos.node($pos.depth).child(index - 1);
  if (previous.type.name !== "scriptBlock") {
    return false;
  }
  return String(previous.attrs.type ?? "action") === type;
}

export function ScriptBlockView({ node, editor, getPos }: NodeViewProps) {
  const { getBlockLabel, getBlockAccent, onOpenBlockMenu } =
    useBlockEditorContext();

  const type = String(node.attrs.type ?? "action");
  const blockId = String(node.attrs.id ?? "");
  const label = getBlockLabel(type);
  const accent = getBlockAccent(type);
  const style = (node.attrs.style ?? DEFAULT_BLOCK_STYLE) as BlockStyle;
  const groupedContinue = isContinuationOfSameType(editor, getPos, type);

  function selectThisBlock() {
    const pos = getPos();
    if (typeof pos === "number") {
      editor.commands.setTextSelection(pos + 1);
    }
  }

  function openMenu(clientX: number, clientY: number) {
    selectThisBlock();
    onOpenBlockMenu({
      blockId,
      type,
      content: node.textContent ?? "",
      clientX,
      clientY,
    });
  }

  return (
    <NodeViewWrapper
      as="div"
      className={`script-block${groupedContinue ? " script-block--grouped-continue" : ""}`}
      data-script-block=""
      data-id={blockId}
      data-type={type}
      data-label={label}
      data-language={node.attrs.language ?? "en"}
      data-grouped-continue={groupedContinue ? "true" : undefined}
      style={{
        fontFamily: style.font,
        fontSize: `${style.size}px`,
        ["--block-accent" as string]: accent,
      }}
      onContextMenu={(event: React.MouseEvent) => {
        event.preventDefault();
        openMenu(event.clientX, event.clientY);
      }}
    >
      <div
        className={`script-block-toolbar${groupedContinue ? " script-block-toolbar--continue" : ""}`}
        contentEditable={false}
      >
        {!groupedContinue ? (
          <span className="script-block-label" style={{ color: accent }}>
            {label}
          </span>
        ) : (
          <span className="script-block-label script-block-label--spacer" aria-hidden />
        )}
        <button
          type="button"
          className="script-block-menu-btn"
          title="Block actions"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const rect = (
              event.currentTarget as HTMLButtonElement
            ).getBoundingClientRect();
            openMenu(rect.right, rect.bottom + 4);
          }}
        >
          ⋯
        </button>
      </div>
      <NodeViewContent as="div" className="script-block-content" />
    </NodeViewWrapper>
  );
}
