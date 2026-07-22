import type OpenAI from "openai";
import { createOpenAiClient } from "@/lib/companion/ai/client";
import { CompanionAiError } from "@/lib/companion/ai/errors";
import { buildJonSystemPrompt } from "@/lib/companion/systemPrompt";

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
 * Stream Jon's reply. Sends only personality system prompt + conversation.
 * Never attach documents, notes, or project payloads.
 */
export async function streamJonChat(
  messages: CompanionChatInputMessage[],
  client: OpenAI = createOpenAiClient(),
): Promise<AsyncIterable<string>> {
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

  try {
    const stream = await client.chat.completions.create({
      model: JON_CHAT_MODEL,
      stream: true,
      messages: [
        { role: "system", content: buildJonSystemPrompt() },
        ...history.map((message) => ({
          role: toOpenAiRole(message.role),
          content: message.content.trim(),
        })),
      ],
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
