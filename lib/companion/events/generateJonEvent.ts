import {
  JON_EVENT_TEMPLATES,
  templateToJonEvent,
} from "@/lib/companion/events/eventTemplates";
import type { JonEvent } from "@/lib/companion/types";

/**
 * Pick a template event. Pass seed for deterministic debug/tests.
 */
export function generateJonEvent(seed?: number): JonEvent {
  const s =
    seed ??
    (Date.now() ^ (Math.floor(Math.random() * 0xffff) << 1));
  const template =
    JON_EVENT_TEMPLATES[Math.abs(s) % JON_EVENT_TEMPLATES.length]!;
  return templateToJonEvent(template);
}
