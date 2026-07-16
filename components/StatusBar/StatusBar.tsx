import type { ScriptBlockType } from "@/types/document";

export type SaveStatus = "loading" | "saving" | "saved" | "error";

type StatusBarProps = {
  projectName: string;
  documentName: string;
  activeType: ScriptBlockType;
  exportVisible: boolean;
  blockCount: number;
  saveStatus: SaveStatus;
};

function saveStatusLabel(status: SaveStatus): string {
  switch (status) {
    case "loading":
      return "Loading";
    case "saving":
      return "Saving";
    case "error":
      return "Save Error";
    case "saved":
      return "Saved Locally";
  }
}

function saveStatusLed(status: SaveStatus): string {
  switch (status) {
    case "loading":
      return "bg-led-orange text-led-orange";
    case "saving":
      return "bg-led-cyan text-led-cyan";
    case "error":
      return "bg-[#c45c5c] text-[#c45c5c]";
    case "saved":
      return "bg-led-green text-led-green";
  }
}

export function StatusBar({
  projectName,
  documentName,
  activeType,
  exportVisible,
  blockCount,
  saveStatus,
}: StatusBarProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-panel-border bg-status px-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`led-dot h-1.5 w-1.5 rounded-full ${saveStatusLed(saveStatus)}`}
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {saveStatusLabel(saveStatus)}
          </span>
        </span>
        <span className="text-panel-border">|</span>
        <span className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
          {projectName} · {documentName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
          Blocks · {blockCount}
        </span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
          Type · {activeType}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`led-dot h-1.5 w-1.5 rounded-full ${
              exportVisible
                ? "bg-led-blue text-led-blue"
                : "bg-[#3a3a42] text-transparent"
            }`}
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {exportVisible ? "Export On" : "Export Off"}
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
          Phase 3.5 · Local
        </span>
      </div>
    </footer>
  );
}
