"use client";

import {
  computeSceneOutlineStats,
  formatOutlineLabel,
  formatSceneNumber,
} from "@/lib/outline/outlineUtils";
import type { OutlineNode } from "@/lib/outline/types";
import type { DocumentBlock } from "@/types/document";

type OutlineNodeRowProps = {
  node: OutlineNode;
  blocks: DocumentBlock[];
  selected: boolean;
  onSelect: (node: OutlineNode) => void;
};

export function OutlineNodeRow({
  node,
  blocks,
  selected,
  onSelect,
}: OutlineNodeRowProps) {
  const stats = computeSceneOutlineStats(blocks, node.sourceBlockId);

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className="module-button w-full rounded-sm border border-panel-border px-2.5 py-2 text-left"
      data-active={selected}
    >
      <div className="flex items-start gap-2">
        <span
          className={`led-dot mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
            selected
              ? "bg-led-blue text-led-blue"
              : "bg-[#3a3a42] text-transparent"
          }`}
          data-lit={selected}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] tracking-[0.16em] text-led-blue uppercase">
            Scene {formatSceneNumber(node.index)}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-foreground">
            {node.title}
          </p>
          <p className="mt-1.5 font-mono text-[9px] tracking-[0.08em] text-muted uppercase">
            Blocks {stats.blockCount} · Dialogue {stats.dialogueCount} · Words{" "}
            {stats.wordCount}
          </p>
          <span className="sr-only">{formatOutlineLabel(node)}</span>
        </div>
      </div>
    </button>
  );
}
