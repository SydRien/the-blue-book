export const RIGHT_SIDEBAR_LAYOUT_KEY = "the-blue-book-right-sidebar-layout-v1";

export const INSPECTOR_HEIGHT_DEFAULT = 300;
export const INSPECTOR_HEIGHT_MIN = 150;

export const SCRATCHPAD_HEIGHT_DEFAULT = 300;
export const SCRATCHPAD_HEIGHT_MIN = 150;

export const JON_HEIGHT_DEFAULT = 400;
export const JON_HEIGHT_MIN = 200;

/** Two horizontal dividers at h-2 (8px) each. */
export const RIGHT_SIDEBAR_DIVIDER_TOTAL = 16;

export type RightSidebarLayoutPreferences = {
  inspectorHeight: number;
  scratchpadHeight: number;
  jonHeight: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function defaultRightSidebarLayout(): RightSidebarLayoutPreferences {
  return {
    inspectorHeight: INSPECTOR_HEIGHT_DEFAULT,
    scratchpadHeight: SCRATCHPAD_HEIGHT_DEFAULT,
    jonHeight: JON_HEIGHT_DEFAULT,
  };
}

/**
 * Fit three panel heights into available space while respecting mins.
 * Extra space goes to Jon; shortage is taken from panels above min (Jon first, then scratchpad, then inspector).
 */
export function normalizeRightSidebarHeights(
  available: number,
  prefs: RightSidebarLayoutPreferences,
): RightSidebarLayoutPreferences {
  const minSum =
    INSPECTOR_HEIGHT_MIN + SCRATCHPAD_HEIGHT_MIN + JON_HEIGHT_MIN;
  const target = Math.max(available, minSum);

  let inspector = Math.max(INSPECTOR_HEIGHT_MIN, prefs.inspectorHeight);
  let scratchpad = Math.max(SCRATCHPAD_HEIGHT_MIN, prefs.scratchpadHeight);
  let jon = Math.max(JON_HEIGHT_MIN, prefs.jonHeight);

  let sum = inspector + scratchpad + jon;

  if (sum < target) {
    jon += target - sum;
  } else if (sum > target) {
    let excess = sum - target;

    const shrinkJon = Math.min(excess, jon - JON_HEIGHT_MIN);
    jon -= shrinkJon;
    excess -= shrinkJon;

    const shrinkScratch = Math.min(excess, scratchpad - SCRATCHPAD_HEIGHT_MIN);
    scratchpad -= shrinkScratch;
    excess -= shrinkScratch;

    const shrinkInspector = Math.min(
      excess,
      inspector - INSPECTOR_HEIGHT_MIN,
    );
    inspector -= shrinkInspector;
  }

  return {
    inspectorHeight: Math.round(inspector),
    scratchpadHeight: Math.round(scratchpad),
    jonHeight: Math.round(jon),
  };
}

export function loadRightSidebarLayout(): RightSidebarLayoutPreferences {
  const defaults = defaultRightSidebarLayout();
  if (!canUseStorage()) {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(RIGHT_SIDEBAR_LAYOUT_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<RightSidebarLayoutPreferences>;
    return {
      inspectorHeight:
        typeof parsed.inspectorHeight === "number"
          ? Math.max(INSPECTOR_HEIGHT_MIN, parsed.inspectorHeight)
          : defaults.inspectorHeight,
      scratchpadHeight:
        typeof parsed.scratchpadHeight === "number"
          ? Math.max(SCRATCHPAD_HEIGHT_MIN, parsed.scratchpadHeight)
          : defaults.scratchpadHeight,
      jonHeight:
        typeof parsed.jonHeight === "number"
          ? Math.max(JON_HEIGHT_MIN, parsed.jonHeight)
          : defaults.jonHeight,
    };
  } catch {
    return defaults;
  }
}

export function saveRightSidebarLayout(
  prefs: RightSidebarLayoutPreferences,
): void {
  if (!canUseStorage()) {
    return;
  }
  const next: RightSidebarLayoutPreferences = {
    inspectorHeight: Math.max(INSPECTOR_HEIGHT_MIN, Math.round(prefs.inspectorHeight)),
    scratchpadHeight: Math.max(
      SCRATCHPAD_HEIGHT_MIN,
      Math.round(prefs.scratchpadHeight),
    ),
    jonHeight: Math.max(JON_HEIGHT_MIN, Math.round(prefs.jonHeight)),
  };
  window.localStorage.setItem(RIGHT_SIDEBAR_LAYOUT_KEY, JSON.stringify(next));
}
