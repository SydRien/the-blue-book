import {
  clearJonChat,
  loadJonChat,
  saveJonChat,
} from "@/lib/companion/chat/localChatStore";
import type { ChatMessage, ChatRole } from "@/lib/companion/chat/types";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Jon conversation facade over localStorage (single global thread for MVP).
 */
export class ChatManager {
  list(): ChatMessage[] {
    return loadJonChat();
  }

  append(role: ChatRole, content: string, id?: string): ChatMessage {
    const message: ChatMessage = {
      id: id ?? crypto.randomUUID(),
      role,
      content,
      createdAt: nowIso(),
    };
    const next = [...this.list(), message];
    saveJonChat(next);
    return message;
  }

  /** Replace entire transcript (e.g. after streaming finalize or clear). */
  replaceAll(messages: ChatMessage[]): void {
    saveJonChat(messages);
  }

  clear(): void {
    clearJonChat();
  }
}

let singleton: ChatManager | null = null;

export function getChatManager(): ChatManager {
  if (!singleton) {
    singleton = new ChatManager();
  }
  return singleton;
}
