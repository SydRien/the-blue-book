import type {
  ChatMessage,
  ChatStoreSnapshot,
} from "@/lib/companion/chat/types";

export const JON_CHAT_STORE_KEY = "the-blue-book:jon-chat-v1";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function readSnapshot(): ChatStoreSnapshot {
  if (!canUseStorage()) {
    return { version: 1, messages: [] };
  }

  try {
    const raw = window.localStorage.getItem(JON_CHAT_STORE_KEY);
    if (!raw) {
      return { version: 1, messages: [] };
    }
    const parsed = JSON.parse(raw) as Partial<ChatStoreSnapshot>;
    if (!Array.isArray(parsed.messages)) {
      return { version: 1, messages: [] };
    }
    return { version: 1, messages: parsed.messages as ChatMessage[] };
  } catch {
    return { version: 1, messages: [] };
  }
}

function writeSnapshot(snapshot: ChatStoreSnapshot): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(JON_CHAT_STORE_KEY, JSON.stringify(snapshot));
}

export function loadJonChat(): ChatMessage[] {
  return readSnapshot().messages;
}

export function saveJonChat(messages: ChatMessage[]): void {
  writeSnapshot({ version: 1, messages });
}

export function clearJonChat(): void {
  writeSnapshot({ version: 1, messages: [] });
}
