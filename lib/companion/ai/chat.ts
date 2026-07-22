import type OpenAI from "openai";
import { createOpenAiClient } from "@/lib/companion/ai/client";
import { CompanionAiError } from "@/lib/companion/ai/errors";
import {
  buildJonPrompt,
  JON_CHARACTER_ENGINE_DEBUG_MARKER,
} from "@/lib/companion/jonPromptBuilder";

export const JON_CHAT_MODEL = "gpt-4o-mini";
export const JON_CHAT_HISTORY_LIMIT = 40;
export const JON_CHAT_MAX_MESSAGES = 60;
export const JON_CHAT_MAX_CONTENT_CHARS = 4000;

export type CompanionChatInputMessage = {
  role: "user" | "jon";
  content: string;
};

function toOpenAiRole(
  role: CompanionChatInputMessage["role"],
): "user" | "assistant" {
  return role === "jon" ? "assistant" : "user";
}

/**
 * Stream Jon's reply. Personality + optional truncated creative context + conversation.
 * Never attach raw documents, notes arrays, or project payloads.
 */
export async function streamJonChat(
  messages: CompanionChatInputMessage[],
  options: {
    client?: OpenAI;
    creativeContext?: string | null;
  } = {},
): Promise<AsyncIterable<string>> {
  const client = options.client ?? createOpenAiClient();
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new CompanionAiError("bad_request", "messages are required");
  }

  if (messages.length > JON_CHAT_MAX_MESSAGES) {
    throw new CompanionAiError("bad_request", "too many messages");
  }

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "jon") {
      throw new CompanionAiError("bad_request", "invalid role");
    }
    if (typeof message.content !== "string" || !message.content.trim()) {
      throw new CompanionAiError("bad_request", "empty message content");
    }
    if (message.content.length > JON_CHAT_MAX_CONTENT_CHARS) {
      throw new CompanionAiError("bad_request", "message too long");
    }
  }

  const history = messages.slice(-JON_CHAT_HISTORY_LIMIT);
  const systemPrompt = buildJonPrompt({
    creativeContext: options.creativeContext,
  });

  // TEMP DEBUG — confirm Character Engine prompt reaches OpenAI call site
  const usesCharacterEngine = systemPrompt.includes(
    JON_CHARACTER_ENGINE_DEBUG_MARKER,
  );
  console.log("[JonDebug] streamJonChat → OpenAI", {
    model: JON_CHAT_MODEL,
    historyCount: history.length,
    systemPromptChars: systemPrompt.length,
    usesCharacterEngine,
    hasYouAreJon: systemPrompt.includes("You are Jon."),
    hasTraitsSection: systemPrompt.includes("Traits:"),
    hasSpeechSection: systemPrompt.includes("Speech:"),
    hasLifeStateSection: systemPrompt.includes("Current life state:"),
    hasCreativeSection: systemPrompt.includes("### Creative context"),
    marker: JON_CHARACTER_ENGINE_DEBUG_MARKER,
  });
  if (!usesCharacterEngine) {
    console.error(
      "[JonDebug] CRITICAL: system prompt missing Character Engine marker",
    );
  }

  try {
    const openAiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((message) => ({
        role: toOpenAiRole(message.role),
        content: message.content.trim(),
      })),
    ];
    console.log("[JonDebug] OpenAI messages[0].role", openAiMessages[0]?.role);
    console.log(
      "[JonDebug] OpenAI system message starts with",
      openAiMessages[0]?.content.slice(0, 80),
    );

    const stream = await client.chat.completions.create({
      model: JON_CHAT_MODEL,
      stream: true,
      messages: openAiMessages,
    });

    async function* tokens(): AsyncIterable<string> {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          yield text;
        }
      }
    }

    return tokens();
  } catch (error) {
    if (error instanceof CompanionAiError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "OpenAI request failed";
    throw new CompanionAiError("upstream", message);
  }
}
