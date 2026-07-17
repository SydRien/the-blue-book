export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "the-blue-book-theme";

export const DEFAULT_THEME: ThemeMode = "dark";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeStoredTheme(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore quota / private mode failures.
  }
}

/** Apply theme to <html data-theme="…"> for CSS variable switching. */
export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.setAttribute("data-theme", theme);
}

/** Inline boot script — set theme before paint to avoid flash. */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")t=${JSON.stringify(DEFAULT_THEME)};document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(DEFAULT_THEME)});}})();`;
