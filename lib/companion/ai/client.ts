import OpenAI from "openai";
import { CompanionAiError } from "@/lib/companion/ai/errors";

/** Server-only OpenAI client. Never import from client components. */
export function createOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new CompanionAiError(
      "missing_key",
      "OPENAI_API_KEY is not configured",
    );
  }
  return new OpenAI({ apiKey });
}
