"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeToDocument,
  DEFAULT_THEME,
  readStoredTheme,
  writeStoredTheme,
  type ThemeMode,
} from "@/lib/theme/theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyThemeToDocument(stored);
    setReady(true);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    writeStoredTheme(next);
    applyThemeToDocument(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      writeStoredTheme(next);
      applyThemeToDocument(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* Avoid mismatch: children always render; theme attrs applied ASAP via boot script. */}
      <div data-theme-ready={ready ? "true" : "false"} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
