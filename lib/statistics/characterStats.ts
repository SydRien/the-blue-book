import { normalizeCharacterName } from "@/lib/statistics/documentStats";
import { countDialogueUnits } from "@/lib/statistics/languageStats";
import type { CharacterDialogueStat } from "@/lib/statistics/types";
import type { DocumentBlock } from "@/types/document";

/**
 * Pairs each character cue with immediately following dialogue blocks
 * (until the next non-dialogue block).
 */
export function computeCharacterDialogueStats(
  blocks: DocumentBlock[],
): CharacterDialogueStat[] {
  type Acc = { dialogueBlocks: number; wordCount: number };
  const byName = new Map<string, Acc>();

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i]!;
    if (block.type !== "character") {
      i += 1;
      continue;
    }

    const name = normalizeCharacterName(block.content);
    i += 1;
    if (!name) {
      continue;
    }

    let dialogueBlocks = 0;
    let wordCount = 0;
    while (i < blocks.length && blocks[i]!.type === "dialogue") {
      dialogueBlocks += 1;
      wordCount += countDialogueUnits(blocks[i]!.content);
      i += 1;
    }

    const existing = byName.get(name) ?? { dialogueBlocks: 0, wordCount: 0 };
    byName.set(name, {
      dialogueBlocks: existing.dialogueBlocks + dialogueBlocks,
      wordCount: existing.wordCount + wordCount,
    });
  }

  const totalDialogueWords = [...byName.values()].reduce(
    (sum, entry) => sum + entry.wordCount,
    0,
  );

  return [...byName.entries()]
    .map(([name, entry]) => ({
      name,
      dialogueBlocks: entry.dialogueBlocks,
      wordCount: entry.wordCount,
      percentage:
        totalDialogueWords > 0
          ? Math.round((entry.wordCount / totalDialogueWords) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.wordCount - a.wordCount || a.name.localeCompare(b.name));
}
