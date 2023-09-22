import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.SERVER_OPEN_AI_API_KEY,
});

const zReqeustSchema = z.object({
  topic: z.string(),
});

interface AINextApiRequest extends NextApiRequest {
  body: {
    topic: string;
  };
}

const handler = async (req: AINextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    try {
      zReqeustSchema.parse(req.body);
    } catch (error) {
      res.status(400).json({ message: "Invalid request body" });
    }
    try {
      const { topic } = zReqeustSchema.parse(req.body);
      const response = await openai.chat.completions.create(
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are beatuiful short horror story teller. Your task is to tell a short horror story about a given topic in less than 100 words.",
            },
            {
              role: "user",
              content: topic,
            },
          ],
          stream: true,
        },
        {
          stream: true,
        },
      );
      for await (const part of response) {
        if (part.choices[0]?.delta?.content) {
          res.write(part.choices[0]?.delta?.content);
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};

export default handler;
