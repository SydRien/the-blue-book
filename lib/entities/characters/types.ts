/**
 * Public character record — organization tool, not AI.
 * Links to DocumentBlock.id via linkedBlocks only (DocumentBlock unchanged).
 */

export type CharacterData = {
  aliases: string[];
  role: string;
  description: string;
  notes: string;
  color: string;
  linkedBlocks: string[];
};

export type CharacterRecord = {
  id: string;
  name: string;
  aliases: string[];
  role: string;
  description: string;
  notes: string;
  color: string;
  linkedBlocks: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateCharacterInput = {
  name: string;
  aliases?: string[];
  role?: string;
  description?: string;
  notes?: string;
  color?: string;
};

export type UpdateCharacterInput = {
  name?: string;
  aliases?: string[];
  role?: string;
  description?: string;
  notes?: string;
  color?: string;
  linkedBlocks?: string[];
};

export const DEFAULT_CHARACTER_DATA: CharacterData = {
  aliases: [],
  role: "",
  description: "",
  notes: "",
  color: "var(--led-orange)",
  linkedBlocks: [],
};
