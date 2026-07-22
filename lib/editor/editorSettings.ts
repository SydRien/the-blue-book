/**
 * Visual editor settings only — never affects DocumentBlock or export.
 */

export const EDITOR_SETTINGS_KEY = "the-blue-book-editor-settings-v1";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 1.5;
export const DEFAULT_ZOOM = 1;

export const ZOOM_STEPS = [
  0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5,
] as const;

export type EditorSettings = {
  zoom: number;
};

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function nearestZoomStep(value: number): number {
  let best = DEFAULT_ZOOM;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const step of ZOOM_STEPS) {
    const dist = Math.abs(step - value);
    if (dist < bestDist) {
      bestDist = dist;
      best = step;
    }
  }
  return best;
}

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ZOOM;
  }
  return nearestZoomStep(
    Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)),
  );
}

export function zoomIn(current: number): number {
  const clamped = clampZoom(current);
  const index = ZOOM_STEPS.findIndex((step) => step >= clamped - 0.001);
  const at = index < 0 ? ZOOM_STEPS.length - 1 : index;
  const exact = ZOOM_STEPS.findIndex((step) => Math.abs(step - clamped) < 0.001);
  const from = exact >= 0 ? exact : at;
  return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, from + 1)] ?? MAX_ZOOM;
}

export function zoomOut(current: number): number {
  const clamped = clampZoom(current);
  const exact = ZOOM_STEPS.findIndex((step) => Math.abs(step - clamped) < 0.001);
  const from =
    exact >= 0
      ? exact
      : ZOOM_STEPS.reduce(
          (best, step, index) =>
            Math.abs(step - clamped) < Math.abs(ZOOM_STEPS[best]! - clamped)
              ? index
              : best,
          0,
        );
  return ZOOM_STEPS[Math.max(0, from - 1)] ?? MIN_ZOOM;
}

export function formatZoomPercent(zoom: number): string {
  return `${Math.round(clampZoom(zoom) * 100)}%`;
}

export function loadEditorSettings(): EditorSettings {
  if (!canUseStorage()) {
    return { zoom: DEFAULT_ZOOM };
  }
  try {
    const raw = window.localStorage.getItem(EDITOR_SETTINGS_KEY);
    if (!raw) {
      return { zoom: DEFAULT_ZOOM };
    }
    const parsed = JSON.parse(raw) as Partial<EditorSettings>;
    return {
      zoom: clampZoom(
        typeof parsed.zoom === "number" ? parsed.zoom : DEFAULT_ZOOM,
      ),
    };
  } catch {
    return { zoom: DEFAULT_ZOOM };
  }
}

export function saveEditorSettings(settings: EditorSettings): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(
    EDITOR_SETTINGS_KEY,
    JSON.stringify({ zoom: clampZoom(settings.zoom) }),
  );
}
