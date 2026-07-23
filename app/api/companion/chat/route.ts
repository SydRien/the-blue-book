import { CompanionAiError } from "@/lib/companion/ai/errors";
import {
  streamJonChat,
  type CompanionChatInputMessage,
} from "@/lib/companion/ai/chat";
import { CREATIVE_CONTEXT_API_MAX_CHARS } from "@/lib/companion/context/types";

export const runtime = "nodejs";

type ChatBody = {
  messages?: CompanionChatInputMessage[];
  /** Truncated creative summary string only — never raw documents. */
  creativeContext?: string;
};

function normalizeCreativeContext(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new CompanionAiError(
      "bad_request",
      "creativeContext must be a string",
    );
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > CREATIVE_CONTEXT_API_MAX_CHARS) {
    throw new CompanionAiError("bad_request", "creativeContext too long");
  }
  return trimmed;
}

export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ignore raw document / notes / project objects if a client sends them.
  const messages = body.messages;

  try {
    const creativeContext = normalizeCreativeContext(body.creativeContext);
    const tokenStream = await streamJonChat(messages ?? [], {
      creativeContext,
    });
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
