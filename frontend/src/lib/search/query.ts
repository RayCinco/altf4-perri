/**
 * Search query generation stage.
 */

import { MARITES_PERSONALITY, FORMAL_PERSONALITY } from "../ai_personality";
import { createGeminiModel, requireGeminiApiKey } from "../ai/gemini";

export async function generateSearchQuery(
  text: string,
  personality: "marites" | "formal" = "marites",
): Promise<string> {
  try {
    requireGeminiApiKey();
  } catch {
    return "NO_SEARCH_NEEDED";
  }

  const model = createGeminiModel();
  const personalityInstruction =
    personality === "formal" ? FORMAL_PERSONALITY : MARITES_PERSONALITY;

  const prompt = `You are a fact-checking assistant. Your job is to read a piece of gossip, news, or a claim, and extract the single most effective Google Search query to verify if it is true or fake.

Personality context (use this to understand the tone and framing of the analysis):
${personalityInstruction}

Rules:
1. Extract the main subject and the core claim (e.g., "Taylor Swift pregnant").
2. Keep it under 5 words if possible.
3. If the text is just random chat, an opinion, or cannot be fact-checked, reply EXACTLY with "NO_SEARCH_NEEDED".
4. Reply ONLY with the search query, nothing else.

Text to analyze:
---
${text}
---`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
