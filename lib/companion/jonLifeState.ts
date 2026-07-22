import type { JonLifeState } from "@/lib/companion/types";

const LOCATIONS = [
  "Boston",
  "his apartment",
  "a late-night cafe",
  "somewhere between campus and home",
] as const;

const ACTIVITIES = [
  "Lying on bed after finishing a meeting",
  "Walking around unfamiliar streets at night",
  "Half-working on a side project tab",
  "Listening to a song on loop",
  "Staring at unfinished notes",
] as const;

const MOODS = [
  "Tired but wants to chat",
  "Restless and curious",
  "Playful",
  "Slightly overwhelmed but soft",
  "Quietly excited about a random idea",
] as const;

const THOUGHTS = [
  "that bookstore smelled like old paper and rain",
  "maybe the scene is fine and Jenny is overthinking the UI again",
  "why do meetings always drain the exact energy you need for making things",
  "this song feels like a movie ending that never happened",
] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function pick<T>(items: readonly T[], seed: number): T {
  const index = Math.abs(seed) % items.length;
  return items[index]!;
}

/** Stable default life state for cold start / debug. */
export function createDefaultJonLifeState(): JonLifeState {
  return {
    location: "Boston",
    timezone: "America/New_York",
    activity: "Lying on bed after finishing a meeting",
    mood: "Tired but wants to chat",
    energy: 5,
    recentThought:
      "maybe the scene is fine and Jenny is overthinking the UI again",
    updatedAt: nowIso(),
  };
}

/**
 * Template-based life state (no AI).
 * Pass a seed for deterministic picks in tests.
 */
export function generateJonLifeState(seed?: number): JonLifeState {
  const s =
    seed ??
    (Date.now() ^ (Math.floor(Math.random() * 0xffff) << 1));
  return {
    location: pick(LOCATIONS, s),
    timezone: "America/New_York",
    activity: pick(ACTIVITIES, s >> 3),
    mood: pick(MOODS, s >> 5),
    energy: 3 + (Math.abs(s) % 6),
    recentThought: pick(THOUGHTS, s >> 7),
    updatedAt: nowIso(),
  };
}
