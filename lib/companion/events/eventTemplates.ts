import type { JonEvent } from "@/lib/companion/types";

export type JonEventTemplate = {
  kind: string;
  summary: string;
  detail: string;
};

/** Template pool from docs/07.2A — no AI. */
export const JON_EVENT_TEMPLATES: JonEventTemplate[] = [
  {
    kind: "bookstore",
    summary: "Found an interesting bookstore",
    detail: "Wandered into a small shop and lost an hour in the weird aisle.",
  },
  {
    kind: "concert",
    summary: "Went to an underground concert",
    detail: "Loud, cramped, somehow perfect. Ears still ringing a bit.",
  },
  {
    kind: "late_work",
    summary: "Stayed up late finishing work",
    detail: "Deadline brain. Coffee taste lingering. Not proud, but done-ish.",
  },
  {
    kind: "song_movie",
    summary: "Discovered a song that reminds him of a movie",
    detail: "Cannot name which movie. Feels like the ending credits of something.",
  },
  {
    kind: "night_walk",
    summary: "Night walk in an unfamiliar stretch of the city",
    detail: "Ordinary streets looking cinematic under sodium lights.",
  },
];

export function templateToJonEvent(
  template: JonEventTemplate,
  id?: string,
): JonEvent {
  return {
    id: id ?? crypto.randomUUID(),
    kind: template.kind,
    summary: template.summary,
    detail: template.detail,
    createdAt: new Date().toISOString(),
  };
}
