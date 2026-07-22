export type ChatRole = "user" | "jon";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatStoreSnapshot = {
  version: 1;
  messages: ChatMessage[];
};
