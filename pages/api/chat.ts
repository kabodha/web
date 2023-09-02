import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
});

export default async function handler(req, res) {
  const { conversation } = req.body;

  const suggestionResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a friendly AI that responds to people's questions with brevity, but in full sentences.`,
      },
      ...conversation,
    ],
  });

  const { choices } = suggestionResponse;
  const {
    message: { content: generation },
  } = choices[0];

  res.status(200).json({ message: generation });
}
