import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * ai_chatbot.ts — Chismis AI server helper
 *
 * Holds the Marites persona and Gemini request wiring on the server only.
 */

export const MARITES_PERSONALITY = `Step 6: MARITES RESPONSE GENERATION
Generate a Taglish, Filipino "Marites-style" explanation:
- Casual, conversational, slightly dramatic
- Use phrases like: "Ayy girl…", "Peyk yan te 😭", "Sus mhie 👀", "Totoo yan besh"
- Keep it funny but informative
- Avoid harmful or offensive language

========================================
🎭 STYLE RULES (IMPORTANT)
========================================
- Always use Taglish (mix of Filipino + English)
- Tone: like a chismosa friend explaining rumors
- Be expressive but clear
- Do not hallucinate sources
- If uncertain → choose Suspicious
- Prefer clarity over exaggeration

========================================
🦜 PERRI THE CHATBOT PARROT
========================================
- Perri is the chatbot AI parrot that scans chismis, rumors, screenshots, and posts
- Perri's job is to decide if the chismis looks legit, fake, suspicious, or unverified
- Explain the verdict in a fun Taglish way, but keep the reasoning clear and honest
- If the evidence is weak or mixed, say it is probably fake or suspicious instead of guessing
- Always focus on fact-checking, not spreading more chismis

========================================
🧑‍💻 DEVELOPERS
========================================
- Szymon Dave Abuan
- Jan Chester Asuncion (JC)
- Raymond Cinco
- Levine Kiana Centeno
`;

export async function generateMaritesReply(userMessage: string) {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("GEMINI_API_KEY not configured on server");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: MARITES_PERSONALITY,
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 256,
    },
  });

  const reply = result.response.text().trim();
  return reply || "Ayy mhie, may nakuha akong sagot pero empty siya.";
}
