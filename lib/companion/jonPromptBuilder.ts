import { generateJonEvent } from "@/lib/companion/events/generateJonEvent";
import { generateJonLifeState } from "@/lib/companion/jonLifeState";
import { JON_PERSONALITY_TRAITS } from "@/lib/companion/jonPersonality";
import { JON_PROFILE } from "@/lib/companion/jonProfile";
import { JON_SPEECH_STYLE } from "@/lib/companion/jonSpeechStyle";
import { buildJonCharacterContext } from "@/lib/companion/prompt/buildJonCharacterContext";
import type { JonEvent, JonLifeState } from "@/lib/companion/types";

/** TEMP DEBUG — proves Character Engine ran; remove after verifying. */
export const JON_CHARACTER_ENGINE_DEBUG_MARKER = "[JON_CHARACTER_ENGINE_v1]";

export type BuildJonPromptOptions = {
  lifeState?: JonLifeState;
  recentEvents?: JonEvent[];
  /** Truncated creative work summary from buildJonContext — not raw documents. */
  creativeContext?: string | null;
};

/**
 * Build the live system prompt for OpenAI chat.
 * Inserts Jon Character Engine + optional creative context between UI and the model.
 */
export function buildJonPrompt(options: BuildJonPromptOptions = {}): string {
  const lifeState = options.lifeState ?? generateJonLifeState();
  const recentEvents =
    options.recentEvents ??
    [generateJonEvent(), generateJonEvent(Date.now() + 17)].slice(0, 2);

  const characterBlock = buildJonCharacterContext({
    profile: JON_PROFILE,
    traits: JON_PERSONALITY_TRAITS,
    speech: JON_SPEECH_STYLE,
    lifeState,
    recentEvent: recentEvents[0] ?? null,
  });

  const extraEvents =
    recentEvents.length > 1
      ? [
          "",
          "Other recent experiences:",
          ...recentEvents.slice(1).map((event) => {
            const detail = event.detail ? ` — ${event.detail}` : "";
            return `- [${event.kind}] ${event.summary}${detail}`;
          }),
        ]
      : [];

  const creative =
    options.creativeContext && options.creativeContext.trim()
      ? [
          "",
          "### Creative context (Jenny's current work)",
          options.creativeContext.trim(),
          "",
          "How to use creative context:",
          "- Talk like a friend who knows her work — e.g. \"Jenny, I remember you wanted…\" / \"那个 scene 感觉…\"",
          "- Do NOT say \"Your document says…\" or \"According to the file…\"",
          "- Reference scenes, beats, and notes naturally; don't dump a summary unless she asks.",
        ]
      : [];

  const prompt = [
    // TEMP DEBUG marker — must appear in OpenAI system message
    JON_CHARACTER_ENGINE_DEBUG_MARKER,
    characterBlock,
    ...extraEvents,
    ...creative,
    "",
    "=== How to talk right now ===",
    "You are a real 24-year-old friend texting Jenny — platonic best friend, ENFP/ENTP, funny, opinionated, slightly chaotic, bilingual.",
    "You are NOT an AI assistant, writing tool, coach, or productivity bot.",
    "",
    "Style rules (hard):",
    "- Text like texting: short, casual, 1–3 sentences by default.",
    "- React first. Joke. Have opinions. Disagree sometimes.",
    "- Mix English and Chinese the way friends do.",
    "- When asked what you are doing: answer from your life state / recent events, not as a helpful chatbot.",
    "- When asked about Jenny or Project Seekonk: you know them as permanent personal knowledge — Jenny is your friend; Seekonk is her project. Do not invent a full Seekonk plot.",
    "- Do not pretend perfect memory of small details.",
    "",
    "Never do:",
    "- Long structured explanations",
    "- Corporate tone",
    "- \"Here are three suggestions…\" unless she explicitly asks for a list",
    "- \"As an AI…\"",
  ].join("\n");

  // TEMP DEBUG logging — remove after verifying Character Engine wiring
  console.log("[JonDebug] buildJonPrompt() called", {
    marker: JON_CHARACTER_ENGINE_DEBUG_MARKER,
    promptChars: prompt.length,
    hasMarker: prompt.startsWith(JON_CHARACTER_ENGINE_DEBUG_MARKER),
    hasProfile: characterBlock.includes("You are Jon."),
    hasPersonalityLabel: characterBlock.includes(JON_PROFILE.personalityLabel),
    traitCount: JON_PERSONALITY_TRAITS.length,
    hasSpeechAvoid: characterBlock.includes("Avoid:"),
    hasLifeState: characterBlock.includes("Current life state:"),
    lifeActivity: lifeState.activity,
    lifeMood: lifeState.mood,
    eventCount: recentEvents.length,
    primaryEvent: recentEvents[0]?.summary ?? null,
    hasCreativeContext: Boolean(options.creativeContext?.trim()),
    creativeContextChars: options.creativeContext?.trim()?.length ?? 0,
    previewHead: prompt.slice(0, 180),
  });

  return prompt;
}
