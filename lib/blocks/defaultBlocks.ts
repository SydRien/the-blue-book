import { DEFAULT_BLOCK_METADATA } from "@/types/document";
import type { BlockDefinition } from "@/lib/blocks/types";

/**
 * Built-in block types. Not deletable.
 * Interactive types (choice, interaction, trigger, system_note) are
 * content objects only — no branching/variables yet.
 */
export const DEFAULT_BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    id: "scene_heading",
    name: "Scene Heading",
    exportRole: "scene_heading",
    editorStyle: { accent: "var(--led-blue)" },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    builtIn: true,
    deletable: false,
  },
  {
    id: "action",
    name: "Action",
    exportRole: "action",
    editorStyle: { accent: "var(--led-cyan)" },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    builtIn: true,
    deletable: false,
  },
  {
    id: "character",
    name: "Character",
    exportRole: "character",
    editorStyle: { accent: "var(--led-orange)" },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    builtIn: true,
    deletable: false,
  },
  {
    id: "dialogue",
    name: "Dialogue",
    exportRole: "dialogue",
    editorStyle: { accent: "var(--led-green)" },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    builtIn: true,
    deletable: false,
  },
  {
    id: "choice",
    name: "Choice",
    exportRole: "choice",
    editorStyle: { accent: "var(--led-cyan)" },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    builtIn: true,
    deletable: false,
  },
  {
    id: "interaction",
    name: "Interaction",
    exportRole: "interaction",
    editorStyle: { accent: "var(--led-blue)" },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    builtIn: true,
    deletable: false,
  },
  {
    id: "trigger",
    name: "Trigger",
    exportRole: "trigger",
    editorStyle: { accent: "var(--led-orange)" },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    builtIn: true,
    deletable: false,
  },
  {
    id: "system_note",
    name: "System Note",
    exportRole: "system_note",
    editorStyle: { accent: "var(--muted)" },
    defaultMetadata: { export: false },
    builtIn: true,
    deletable: false,
  },
];

export const BUILT_IN_BLOCK_TYPE_IDS = DEFAULT_BLOCK_DEFINITIONS.map(
  (definition) => definition.id,
);
