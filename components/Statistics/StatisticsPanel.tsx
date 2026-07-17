"use client";

import { useMemo, type ReactNode } from "react";
import { computeDocumentStats } from "@/lib/statistics/computeDocumentStats";
import type { BlueBookDocument } from "@/types/document";

type StatisticsPanelProps = {
  document: BlueBookDocument;
  open: boolean;
  onClose: () => void;
};

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-panel-border/60 py-1.5 last:border-b-0">
      <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        {label}
      </span>
      <span className="font-mono text-[11px] text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}

function ModuleSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-sm border border-panel-border bg-panel-inset p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="led-dot h-1.5 w-1.5 rounded-full"
          data-lit="true"
          style={{ backgroundColor: accent, color: accent }}
          aria-hidden
        />
        <p className="font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
          {title}
        </p>
      </div>
      {children}
    </section>
  );
}

export function StatisticsPanel({
  document,
  open,
  onClose,
}: StatisticsPanelProps) {
  const report = useMemo(() => computeDocumentStats(document), [document]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[min(820px,92vh)] w-full max-w-lg flex-col rounded-sm border border-panel-border bg-panel shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
          <div>
            <p className="font-mono text-sm tracking-[0.16em] text-foreground uppercase">
              Statistics
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              {document.title || "Untitled"} · Structure only
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="panel-screw" />
              <span className="panel-screw" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <ModuleSection title="Document" accent="var(--led-blue)">
            <StatRow label="Total blocks" value={report.document.totalBlocks} />
            <StatRow label="Scenes" value={report.document.sceneCount} />
            <StatRow label="Action" value={report.document.actionCount} />
            <StatRow label="Dialogue" value={report.document.dialogueCount} />
            <StatRow
              label="Characters"
              value={report.document.characterCount}
            />
          </ModuleSection>

          <ModuleSection title="Text" accent="var(--led-cyan)">
            <StatRow
              label="English words"
              value={report.text.englishWordCount}
            />
            <StatRow
              label="Chinese characters"
              value={report.text.chineseCharacterCount}
            />
            <StatRow
              label="Total characters"
              value={report.text.totalCharacters}
            />
          </ModuleSection>

          <ModuleSection title="Pages" accent="var(--led-orange)">
            <StatRow
              label="Estimated pages"
              value={report.pages.estimatedPages}
            />
            <StatRow
              label="Estimated minutes"
              value={`≈ ${report.pages.estimatedMinutes}`}
            />
            <StatRow
              label="Estimated lines"
              value={report.pages.estimatedLines}
            />
            <p className="mt-2 font-mono text-[9px] leading-relaxed tracking-[0.08em] text-muted uppercase">
              US Letter · 12pt Courier wrap model · 1 page ≈ 1 min
            </p>
          </ModuleSection>

          <ModuleSection title="Character Dialogue" accent="var(--led-green)">
            {report.characters.length === 0 ? (
              <p className="font-mono text-[10px] text-muted">
                No character / dialogue pairs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {report.characters.map((entry) => (
                  <div
                    key={entry.name}
                    className="border-b border-panel-border/50 pb-2 last:border-b-0 last:pb-0"
                  >
                    <p className="font-mono text-[11px] tracking-[0.1em] text-foreground uppercase">
                      {entry.name}
                    </p>
                    <div className="mt-1 grid grid-cols-3 gap-2 font-mono text-[10px] text-muted">
                      <span>Lines · {entry.dialogueBlocks}</span>
                      <span>Words · {entry.wordCount}</span>
                      <span className="text-led-green">
                        {entry.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModuleSection>
        </div>

        <div className="border-t border-panel-border px-4 py-2">
          <p className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
            Live from document JSON · no AI
          </p>
        </div>
      </div>
    </div>
  );
}
