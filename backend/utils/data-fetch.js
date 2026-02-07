// Ollama helper
// import { Ollama } from "ollama";
const { Ollama } = require("ollama");

//;

const studentContext = "he is enginner student ";
const user = {
  avgScore: 82,
  weaknesses: ["Thermodynamics"],
  recentMistakeDescription: "Confiused about first law of thermodynamic",
};
const QUESTION_GEN_SYSTEM_STRING = `
${studentContext}

ROLE: You are an Adaptive Assessment Engine.
TASK: Generate ONE highly specific Multiple Choice Question (MCQ).

CONSTRAINTS:
1. DIFFICULTY: Since the student's average is ${user.avgScore}%, set the difficulty to ${user.avgScore > 75 ? "Hard" : "Intermediate"}.
2. TOPIC: Focus specifically on the student's WEAK AREA: ${user.weaknesses[0]}.
3. FORMAT: You MUST return ONLY a JSON object with this structure:
{
  "question": "text",
  "options": ["A", "B", "C", "D"],
  "correct_answer": "option text",
  "explanation_for_improvement": "A deep feedback note based on their previous mistake: ${user.recentMistakeDescription}"
}
4. NO PROSE: Do not say "Here is your question." Just return the JSON.
`;

async function runOllamaChat(prompt = QUESTION_GEN_SYSTEM_STRING) {
  const ollama = new Ollama({
    host: "https://ollama.com",
    headers: {
      Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
    },
  });

  const response = await ollama.chat({
    model: "gpt-oss:120b",
    messages: [{ role: "user", content: "Explain quantum computing" }],
    stream: true,
  });

  for await (const part of response) {
    process.stdout.write(part.message.content);
  }
}

module.exports = runOllamaChat;
