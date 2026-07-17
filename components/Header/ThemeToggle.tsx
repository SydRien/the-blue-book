"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * Y2K hardware slider — DARK ◉━━━━○ LIGHT
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="theme-toggle inline-flex items-center gap-2 rounded-sm border border-panel-border bg-panel-inset px-2.5 py-1.5"
    >
      <span
        className={`font-mono text-[9px] tracking-[0.16em] uppercase ${
          !isLight ? "text-foreground" : "text-muted"
        }`}
      >
        Dark
      </span>
      <span className="theme-toggle-track" aria-hidden>
        <span
          className="theme-toggle-knob"
          data-position={isLight ? "right" : "left"}
        />
      </span>
      <span
        className={`font-mono text-[9px] tracking-[0.16em] uppercase ${
          isLight ? "text-foreground" : "text-muted"
        }`}
      >
        Light
      </span>
    </button>
  );
}
