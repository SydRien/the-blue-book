import { computeCharacterDialogueStats } from "@/lib/statistics/characterStats";
import { computeDocumentBlockCounts } from "@/lib/statistics/documentStats";
import { computeTextStatistics } from "@/lib/statistics/languageStats";
import { estimateScreenplayPages } from "@/lib/statistics/pageEstimator";
import type { DocumentStatsReport } from "@/lib/statistics/types";
import type { BlueBookDocument } from "@/types/document";

/** Pure statistics pass over BlueBookDocument — no AI, no export/PDF. */
export function computeDocumentStats(
  document: BlueBookDocument,
): DocumentStatsReport {
  const blocks = document.blocks;

  return {
    document: computeDocumentBlockCounts(blocks),
    text: computeTextStatistics(blocks),
    characters: computeCharacterDialogueStats(blocks),
    pages: estimateScreenplayPages(blocks),
  };
}
