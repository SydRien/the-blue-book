import { CompanionAiError } from "@/lib/companion/ai/errors";
import {
  streamJonChat,
  type CompanionChatInputMessage,
} from "@/lib/companion/ai/chat";

export const runtime = "nodejs";

type ChatBody = {
  messages?: CompanionChatInputMessage[];
};

export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ignore any documents/notes/project fields if a client sends them.
  const messages = body.messages;

  try {
    const tokenStream = await streamJonChat(messages ?? []);
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const token of tokenStream) {
            controller.enqueue(encoder.encode(token));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof CompanionAiError) {
      const status =
        error.code === "missing_key"
          ? 500
          : error.code === "bad_request"
            ? 400
            : 502;
      return Response.json({ error: error.message }, { status });
    }
    return Response.json({ error: "Chat failed" }, { status: 500 });
  }
}
