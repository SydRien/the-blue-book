"use client";

import { createContext, useContext } from "react";
import type { BlockTypeId } from "@/types/document";

export type BlockInstanceMenuRequest = {
  blockId: string;
  type: BlockTypeId;
  content: string;
  clientX: number;
  clientY: number;
};

export type BlockEditorContextValue = {
  getBlockLabel: (typeId: BlockTypeId) => string;
  getBlockAccent: (typeId: BlockTypeId) => string;
  onOpenBlockMenu: (request: BlockInstanceMenuRequest) => void;
};

const BlockEditorContext = createContext<BlockEditorContextValue | null>(null);

export function BlockEditorProvider({
  value,
  children,
}: {
  value: BlockEditorContextValue;
  children: React.ReactNode;
}) {
  return (
    <BlockEditorContext.Provider value={value}>
      {children}
    </BlockEditorContext.Provider>
  );
}

export function useBlockEditorContext(): BlockEditorContextValue {
  const value = useContext(BlockEditorContext);
  if (!value) {
    return {
      getBlockLabel: (typeId) => typeId,
      getBlockAccent: () => "var(--muted)",
      onOpenBlockMenu: () => {},
    };
  }
  return value;
}
