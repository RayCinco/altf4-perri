/**
 * ai_search.ts — SerperDev Search Fact-Checking Engine
 *
 * Handles generating search queries from unstructured text and
 * querying the SerperDev API to retrieve context
 * for the AI to use in its final verdict.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MARITES_PERSONALITY, FORMAL_PERSONALITY } from "./ai_personality";
import type { PipelineLogger } from "./logger";
import type { SearchSource } from "./source_filter";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The structured return from the fact-check search step */
export interface FactCheckResult {
  /** Raw search result objects for downstream filtering */
  rawSources: SearchSource[];
  /** Formatted text context (all sources, pre-filter) */
  formatted: string;
}

// ─── Main Search Function ─────────────────────────────────────────────────────

/**
 * Main fact-checking pipeline.
 * Extracts a query from the text, searches via SerperDev, and returns
 * both raw structured results and a formatted context string.
 *
 * @param text   - The raw text or OCR extracted text
 * @param logger - Optional pipeline logger to record search steps
 * @returns FactCheckResult with raw sources and formatted context, or null if skipped
 */
export async function executeFactCheck(
  text: string,
  logger?: PipelineLogger,
  personality: "marites" | "formal" = "marites"
): Promise<FactCheckResult | null> {
  const serperApiKey = process.env.SERPER_API_KEY;

  // Graceful fallback if SerperDev API key is not configured
  if (!serperApiKey || serperApiKey === "your_serper_api_key_here") {
    console.log("[SEARCH] ⚠️ SERPER_API_KEY missing. Skipping fact-check.");
    logger?.log("SEARCH", "Skipped — SERPER_API_KEY not configured");
    return null;
  }

  try {
    console.log("[SEARCH] 🧠 Generating search query from text...");
    const query = await generateSearchQuery(text, personality);

    logger?.log("SEARCH", "Query generated from text", {
      inputTextPreview: text.substring(0, 200),
      generatedQuery: query,
    });

    if (!query || query === "NO_SEARCH_NEEDED") {
      console.log("[SEARCH] ⏭️ AI determined no search is needed for this text.");
      logger?.log("SEARCH", "No search needed — AI decided to skip");
      return null;
    }

    console.log(`[SEARCH] 🔍 Searching SerperDev for: "${query}"`);

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 10, // Get top 10 results for better credibility coverage
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[SEARCH] SerperDev API Error:", errorData);
      logger?.log("SEARCH", "SerperDev API returned an error", {
        status: response.status,
        error: errorData,
      });
      return null;
    }

    const data = await response.json();

    if (!data.organic || data.organic.length === 0) {
      console.log("[SEARCH] 📭 No relevant search results found.");
      logger?.log("SEARCH", "No results found", { query });
      return {
        rawSources: [],
        formatted: "NO SEARCH RESULTS FOUND FOR THIS CLAIM.",
      };
    }

    console.log(`[SEARCH] ✅ Found ${data.organic.length} search results.`);

    // Build structured raw sources
    const rawSources: SearchSource[] = data.organic.map((item: any) => ({
      title: item.title || "",
      snippet: item.snippet || "",
      link: item.link || "",
    }));

    // Format the results into a readable context string
    const formatted = rawSources
      .map((item, index) => {
        return `Source ${index + 1}:\nTitle: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}\n`;
      })
      .join("\n");

    logger?.log("SEARCH", "Search results retrieved", {
      query,
      resultCount: rawSources.length,
      results: rawSources,
    });

    return { rawSources, formatted };
  } catch (error) {
    console.error("[SEARCH] ❌ Fact-checking failed:", error);
    logger?.log("SEARCH", "Fact-check failed with exception", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ─── Query Generator ──────────────────────────────────────────────────────────

/**
 * Uses Gemini to extract a concise search query from the chismis.
 */
async function generateSearchQuery(
  text: string,
  personality: "marites" | "formal" = "marites"
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "NO_SEARCH_NEEDED";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

// ─── Prompt Formatters ────────────────────────────────────────────────────────

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
