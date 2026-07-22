import { JON_PROFILE } from "@/lib/companion/jonProfile";
import { buildJonPrompt } from "@/lib/companion/jonPromptBuilder";
import type { JonProfile } from "@/lib/companion/types";

/**
 * @deprecated Prefer buildJonPrompt() from jonPromptBuilder.
 * Kept so older imports keep working; now delegates to the character engine.
 */
export function buildJonSystemPrompt(
  _profile: JonProfile = JON_PROFILE,
): string {
  return buildJonPrompt();
}

export { buildJonPrompt };
