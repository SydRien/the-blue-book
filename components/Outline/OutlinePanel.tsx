"use client";

import { useMemo } from "react";
import { OutlineNodeRow } from "@/components/Outline/OutlineNode";
import { buildOutline } from "@/lib/outline/buildOutline";
import type { OutlineNode } from "@/lib/outline/types";
import type { BlueBookDocument } from "@/types/document";

type OutlinePanelProps = {
  document: BlueBookDocument | null;
  selectedSourceBlockId: string | null;
  onSelectNode: (node: OutlineNode) => void;
};

export function OutlinePanel({
  document,
  selectedSourceBlockId,
  onSelectNode,
}: OutlinePanelProps) {
  const outline = useMemo(
    () => buildOutline(document?.blocks ?? []),
    [document?.blocks],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-panel-border px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Narrative Outline
        </p>
        <p className="mt-1 font-mono text-[9px] tracking-[0.08em] text-muted">
          Derived from scene headings · not a separate source
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-2">
        {!document ? (
          <p className="px-1 py-3 font-mono text-[10px] text-muted">
            Open a document to view scenes.
          </p>
        ) : outline.nodes.length === 0 ? (
          <p className="px-1 py-3 font-mono text-[10px] leading-relaxed text-muted">
            No scenes yet. Add a Scene Heading block to populate the outline.
          </p>
        ) : (
          outline.nodes.map((node) => (
            <OutlineNodeRow
              key={node.id}
              node={node}
              blocks={document.blocks}
              selected={selectedSourceBlockId === node.sourceBlockId}
              onSelect={onSelectNode}
            />
          ))
        )}
      </div>

      <div className="border-t border-panel-border px-3 py-2">
        <p className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
          {outline.nodes.length} scene
          {outline.nodes.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
