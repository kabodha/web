import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
});

export default async function handler(req, res) {
  const { body } = req;
  const { conversation } = body;

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a friendly AI that responds to people's questions with brevity, but in full sentences.`,
      },
      ...conversation,
    ],
  });

  for await (const part of stream) {
    res.write(part.choices[0]?.delta?.content || "");
  }

  res.end();
}
