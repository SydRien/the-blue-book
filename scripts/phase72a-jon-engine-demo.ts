/**
 * Phase 7.2A — Jon Character Engine smoke check.
 * Run: npx tsx scripts/phase72a-jon-engine-demo.ts
 */
import { generateJonEvent } from "../lib/companion/events/generateJonEvent";
import { createDefaultJonLifeState } from "../lib/companion/jonLifeState";
import { JON_PERSONALITY_TRAITS } from "../lib/companion/jonPersonality";
import { JON_PROFILE } from "../lib/companion/jonProfile";
import { JON_SPEECH_STYLE } from "../lib/companion/jonSpeechStyle";
import { buildJonCharacterContext } from "../lib/companion/prompt/buildJonCharacterContext";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(JON_PROFILE.name === "Jon", "profile name");
assert(JON_PROFILE.fullName === "Joni", "profile fullName");
assert(JON_PROFILE.knows.projectSeekonk.summary.length > 0, "seekonk knowledge");
assert(JON_PERSONALITY_TRAITS.length === 8, "eight traits");
assert(JON_SPEECH_STYLE.avoidPatterns.length > 0, "speech avoid");

const life = createDefaultJonLifeState();
assert(life.location === "Boston", "default life location");
assert(typeof life.energy === "number", "life energy");

const event = generateJonEvent(42);
assert(Boolean(event.id && event.kind && event.summary), "event fields");

const context = buildJonCharacterContext({
  lifeState: life,
  recentEvent: event,
});
assert(context.includes("You are Jon."), "context header");
assert(context.includes("Project Seekonk"), "context seekonk");
assert(context.length > 200, "context length");

console.log("phase72a-jon-engine-demo: ok");
console.log({
  profile: JON_PROFILE.name,
  traits: JON_PERSONALITY_TRAITS.map((t) => t.name),
  avoidCount: JON_SPEECH_STYLE.avoidPatterns.length,
  life: { location: life.location, mood: life.mood, energy: life.energy },
  event: { kind: event.kind, summary: event.summary },
  contextChars: context.length,
});
