type AppHeaderProps = {
  projectName: string;
  documentName: string;
};

export function AppHeader({ projectName, documentName }: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-panel-border bg-panel px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="panel-screw" />
          <span className="panel-screw" />
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="font-mono text-sm font-medium tracking-[0.18em] text-foreground uppercase">
            The Blue Book
          </h1>
          <span className="text-xs text-muted">/</span>
          <span className="font-mono text-xs text-led-cyan">{projectName}</span>
          <span className="text-xs text-muted">/</span>
          <span className="font-mono text-xs text-muted">{documentName}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="led-dot h-1.5 w-1.5 rounded-full bg-led-orange text-led-orange"
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            Instrument Mode
          </span>
        </span>
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="panel-screw" />
          <span className="panel-screw" />
        </div>
      </div>
    </header>
  );
}
