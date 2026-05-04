/**
 * ai_search.ts — Google Custom Search Fact-Checking Engine
 *
 * Handles generating search queries from unstructured text and
 * querying the Google Custom Search API to retrieve context
 * for the AI to use in its final verdict.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Main fact-checking pipeline.
 * Extracts a query from the text, searches Google, and formats the results.
 * 
 * @param text - The raw text or OCR extracted text
 * @returns A formatted string of search results, or null if search was skipped/failed
 */
export async function executeFactCheck(text: string): Promise<string | null> {
  const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchCx = process.env.GOOGLE_SEARCH_CX;

  // Graceful fallback if search API keys are not configured
  if (!searchApiKey || !searchCx || searchApiKey === "your_google_search_api_key_here") {
    console.log("[SEARCH] ⚠️ Search API keys missing. Skipping fact-check.");
    return null;
  }

  try {
    console.log("[SEARCH] 🧠 Generating search query from text...");
    const query = await generateSearchQuery(text);
    
    if (!query || query === "NO_SEARCH_NEEDED") {
      console.log("[SEARCH] ⏭️ AI determined no search is needed for this text.");
      return null;
    }

    console.log(`[SEARCH] 🔍 Searching Google for: "${query}"`);
    
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", searchApiKey);
    url.searchParams.append("cx", searchCx);
    url.searchParams.append("q", query);
    url.searchParams.append("num", "3"); // Get top 3 results

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[SEARCH] Google API Error:", errorData);
      return null;
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log("[SEARCH] 📭 No relevant search results found.");
      return "NO SEARCH RESULTS FOUND FOR THIS CLAIM.";
    }

    console.log(`[SEARCH] ✅ Found ${data.items.length} search results.`);
    
    // Format the results into a readable context string for Gemini
    const formattedResults = data.items.map((item: any, index: number) => {
      return `Source ${index + 1}:\nTitle: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}\n`;
    }).join("\n");

    return formattedResults;
  } catch (error) {
    console.error("[SEARCH] ❌ Fact-checking failed:", error);
    return null;
  }
}

/**
 * Uses Gemini to extract a concise Google search query from the chismis.
 */
async function generateSearchQuery(text: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "NO_SEARCH_NEEDED";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a fact-checking assistant. Your job is to read a piece of gossip, news, or a claim, and extract the single most effective Google Search query to verify if it is true or fake.

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

/**
 * Formats the search context to be appended to the user prompt.
 */
export function formatSearchContextPrompt(searchContext: string): string {
  return `\n\nAdditional search context for fact-checking:\n${searchContext}`;
}

/**
 * Formats the main user prompt with the text to analyze.
 */
export function formatUserPrompt(text: string): string {
  return `Analyze the following text and classify it:\n\n---\n${text}\n---`;
}
