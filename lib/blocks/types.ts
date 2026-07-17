import type { BlockMetadata, BlockTypeId } from "@/types/document";

/** Display / editor chrome for a block type. */
export type BlockEditorStyle = {
  accent: string;
};

/**
 * Registry definition for built-in and custom block types.
 * exportRole is a reserved mapping hint — exporters are unchanged in 6.1.
 */
export type BlockDefinition = {
  id: BlockTypeId;
  name: string;
  exportRole: string | null;
  editorStyle: BlockEditorStyle;
  defaultMetadata: BlockMetadata;
  builtIn: boolean;
  deletable: boolean;
};

/** Payload stored on block_type entities for custom types. */
export type CustomBlockTypeData = {
  exportRole: string | null;
  editorStyle: BlockEditorStyle;
  defaultMetadata: BlockMetadata;
};
