export const LAYOUT_STORAGE_KEY = "the-blue-book-layout-v1";

export const LEFT_SIDEBAR_DEFAULT = 300;
export const LEFT_SIDEBAR_MIN = 220;
export const LEFT_SIDEBAR_MAX = 500;

export const RIGHT_SIDEBAR_DEFAULT = 360;
export const RIGHT_SIDEBAR_MIN = 280;
export const RIGHT_SIDEBAR_MAX = 600;

export const EDITOR_MIN_WIDTH = 280;

export type LayoutPreferences = {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampLeftWidth(width: number): number {
  return clamp(width, LEFT_SIDEBAR_MIN, LEFT_SIDEBAR_MAX);
}

export function clampRightWidth(width: number): number {
  return clamp(width, RIGHT_SIDEBAR_MIN, RIGHT_SIDEBAR_MAX);
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function loadLayoutPreferences(): LayoutPreferences {
  const defaults: LayoutPreferences = {
    leftSidebarWidth: LEFT_SIDEBAR_DEFAULT,
    rightSidebarWidth: RIGHT_SIDEBAR_DEFAULT,
  };

  if (!canUseStorage()) {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<LayoutPreferences>;
    return {
      leftSidebarWidth: clampLeftWidth(
        typeof parsed.leftSidebarWidth === "number"
          ? parsed.leftSidebarWidth
          : LEFT_SIDEBAR_DEFAULT,
      ),
      rightSidebarWidth: clampRightWidth(
        typeof parsed.rightSidebarWidth === "number"
          ? parsed.rightSidebarWidth
          : RIGHT_SIDEBAR_DEFAULT,
      ),
    };
  } catch {
    return defaults;
  }
}

export function saveLayoutPreferences(prefs: LayoutPreferences): void {
  if (!canUseStorage()) {
    return;
  }
  const next: LayoutPreferences = {
    leftSidebarWidth: clampLeftWidth(prefs.leftSidebarWidth),
    rightSidebarWidth: clampRightWidth(prefs.rightSidebarWidth),
  };
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
}
