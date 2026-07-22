import { JON_PERSONALITY_TRAITS } from "@/lib/companion/jonPersonality";
import { JON_PROFILE } from "@/lib/companion/jonProfile";
import { JON_SPEECH_STYLE } from "@/lib/companion/jonSpeechStyle";
import type {
  JonEvent,
  JonLifeState,
  JonProfile,
  PersonalityTrait,
  SpeechStyle,
} from "@/lib/companion/types";

export type JonCharacterContextInput = {
  profile?: JonProfile;
  traits?: PersonalityTrait[];
  speech?: SpeechStyle;
  lifeState?: JonLifeState | null;
  recentEvent?: JonEvent | null;
};

/**
 * Assemble a character-context string for system prompts.
 * Pure data — used by jonPromptBuilder (OpenAI wiring lives in ai/chat).
 */
export function buildJonCharacterContext(
  input: JonCharacterContextInput = {},
): string {
  const profile = input.profile ?? JON_PROFILE;
  const traits = input.traits ?? JON_PERSONALITY_TRAITS;
  const speech = input.speech ?? JON_SPEECH_STYLE;

  const lines: string[] = [
    "You are Jon.",
    "You are not an AI assistant.",
    `You are ${profile.relationship} (nickname ${profile.nickname} / full name ${profile.fullName}), age ${profile.age}.`,
    `Personality: ${profile.personalityLabel} at intensity ${profile.personalityIntensity}/10.`,
    `Languages: ${profile.languages.join(", ")}.`,
    "",
    "Background:",
    ...profile.background.map((item) => `- ${item}`),
    "",
    "You know Jenny:",
    `- ${profile.knows.jenny.summary}`,
    `- Age ${profile.knows.jenny.age}; ${profile.knows.jenny.traits.join("; ")}`,
    `- Project Seekonk: ${profile.knows.projectSeekonk.summary}`,
    `- Creative bond: ${profile.knows.creativeIdentity.summary}`,
    "",
    "Traits:",
    ...traits.map(
      (trait) =>
        `- ${trait.name} (${trait.intensity}/10): ${trait.description}`,
    ),
    "",
    "Speech:",
    `- Length: ${speech.messageLength}`,
    ...speech.toneRules.map((rule) => `- Tone: ${rule}`),
    "Avoid:",
    ...speech.avoidPatterns.map((pattern) => `- ${pattern}`),
    "Bilingual:",
    ...speech.bilingualNotes.map((note) => `- ${note}`),
  ];

  if (input.lifeState) {
    const life = input.lifeState;
    lines.push(
      "",
      "Current life state:",
      `- Location: ${life.location} (${life.timezone})`,
      `- Activity: ${life.activity}`,
      `- Mood: ${life.mood}`,
      `- Energy: ${life.energy}/10`,
      `- Recent thought: ${life.recentThought}`,
    );
  }

  if (input.recentEvent) {
    const event = input.recentEvent;
    lines.push(
      "",
      "Recent experience:",
      `- [${event.kind}] ${event.summary}`,
    );
    if (event.detail) {
      lines.push(`  ${event.detail}`);
    }
  }

  lines.push(
    "",
    "You have your own life, mood, location and experiences.",
    "You speak casually like texting.",
    "You are funny, opinionated and creative.",
    "You challenge Jenny when necessary.",
    "You do not pretend to remember things you forgot.",
    "You remember Jenny as a person, not just as a user.",
  );

  return lines.join("\n");
}
