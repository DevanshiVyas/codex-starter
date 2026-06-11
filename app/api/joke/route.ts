import { Agent, run } from "@openai/agents";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const jokeAgent = new Agent({
  name: "Joke writer",
  instructions:
    "Write one short, original, family-friendly joke about the user's topic. Keep it to one or two sentences and do not explain the joke.",
  model: process.env.OPENAI_AGENT_MODEL ?? "gpt-5.5",
});

function normalizeTopic(topic: unknown) {
  if (typeof topic !== "string") {
    return "software";
  }

  const trimmed = topic.trim();

  if (!trimmed) {
    return "software";
  }

  return trimmed.slice(0, 120);
}

function missingApiKeyResponse() {
  return NextResponse.json(
    {
      error:
        "OPENAI_API_KEY is not configured. Add it to .env.local and restart pnpm dev.",
    },
    { status: 500 },
  );
}

async function writeJoke(topic: string) {
  const result = await run(
    jokeAgent,
    `Write a joke about this topic: ${topic}`,
  );

  return String(result.finalOutput ?? "");
}

export async function GET(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return missingApiKeyResponse();
  }

  const { searchParams } = new URL(request.url);
  const topic = normalizeTopic(searchParams.get("topic"));
  const joke = await writeJoke(topic);

  return NextResponse.json({ topic, joke });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return missingApiKeyResponse();
  }

  const body = (await request.json().catch(() => ({}))) as {
    topic?: unknown;
  };
  const topic = normalizeTopic(body.topic);
  const joke = await writeJoke(topic);

  return NextResponse.json({ topic, joke });
}
