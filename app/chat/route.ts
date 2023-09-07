import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
});

export async function POST(req: Request) {
  const { conversation } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [
      {
        role: "system",
        content: `Keep the conversation engaging by asking questions back to the user.`,
      },
      ...conversation,
    ],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
