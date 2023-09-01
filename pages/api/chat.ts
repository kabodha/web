import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
});

export default async function handler(req, res) {
  const { message } = req.body;

  const suggestionResponse = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a friendly AI that responds to people's questions with brevity`,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  const { choices } = suggestionResponse;
  const {
    message: { content: generation },
  } = choices[0];

  res.status(200).json({ message: generation });
}
