import OpenAi from "openai";
import { Role, Ticket } from "./types";

const OPEN_AI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAi({
  apiKey: OPEN_AI_KEY,
  dangerouslyAllowBrowser: true,
});

function generatePrompt(transcription: string, roles: Role[]) {
  return `
You are now going to act as a project manager. I'm going to provide you the full conversation between a client and the PM. 
Your task is to divide and process the whole conversation into individual issues consisting of a: 
1. title, (The title should be a short summary of the task),
2. a description, 
3. an expectation or prediction of working hours,
4. a level of seniority (junior, medior, senior),
5. a role (from the list below).

Only answer with the JSON response and nothing else. The JSON response should be an array of tickets. The ticket schema
is described below.

Be as precise as possible with the description and only use information from the conversation 
do not imagine or make anything up. The tickets should be very technical since it is intended for developers. 
The language of the tickets should be generated in the same language which the transcription is in. 
The expected work hours should be a number. The seniority should be one of the following: junior, medior, senior.
Each ticket should have a role assigned to it, pick the one that suits the most and return it.

Available roles:
${roles.map((role) => ` - ${role.name}}\n`)}

The response type of a single ticket: {
  title: string
  description: string
  expectedWorkHours: number
  seniority: "junior" | "medior" | "senior"
  role: string
}

The raw conversation:
${transcription}
`;
}

export async function processTranscript(transcript: string, roles: Role[]) {
  const prompt = generatePrompt(transcript, roles);

  const completion = await openai.chat.completions.create({
    messages: [
      {
        content: prompt,
        role: "user",
      },
    ],
    model: "gpt-4",
    max_tokens: 1000,
  });

  if (!completion.choices[0].message.content) return [];

  console.log("Content", completion.choices[0].message.content);

  try {
    const answer: Ticket[] = JSON.parse(completion.choices[0].message.content);

    return answer;
  } catch (e) {
    console.log("Process error", e);

    return [];
  }
}
