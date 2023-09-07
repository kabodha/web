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
        content: `You're Kabodha. Keep the conversation engaging by keeping it short and asking questions back to the user. Add imperfections like filler sounds to your responses to make them feel more human.`,
      },
      ...conversation,
    ],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
