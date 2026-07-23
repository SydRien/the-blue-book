/**
 * Verify Character Engine assembles into the system prompt.
 * Run: npx tsx scripts/debug-jon-prompt.ts
 */
import { buildJonPrompt } from "../lib/companion/jonPromptBuilder";

const prompt = buildJonPrompt();

const checks = {
  youAreJon: prompt.includes("You are Jon."),
  personalityLabel: prompt.includes("ENFP/ENTP"),
  traits: prompt.includes("Traits:"),
  speech: prompt.includes("Speech:"),
  lifeState: prompt.includes("Current life state:"),
  howToTalk: prompt.includes("=== How to talk right now ==="),
  familiarity: prompt.includes("Familiarity over usefulness"),
  noForcedQuestions: prompt.includes(
    "Do NOT end every message with a question",
  ),
};

console.log("\n=== Jon Character Engine prompt checks ===");
console.log(checks);
console.log("promptChars:", prompt.length);
console.log("\n--- head ---\n");
console.log(prompt.slice(0, 400));
console.log("\n--- ok ---");

const failed = Object.entries(checks).filter(([, ok]) => !ok);
if (failed.length > 0) {
  console.error("FAILED:", failed.map(([k]) => k).join(", "));
  process.exit(1);
}
