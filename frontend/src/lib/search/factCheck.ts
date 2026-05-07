/**
 * SerperDev fact-check execution stage.
 */

import type { SearchSource } from "../source_filter";
import { generateSearchQuery } from "./query";

export interface FactCheckResult {
  rawSources: SearchSource[];
  formatted: string;
}

export async function executeFactCheck(
  text: string,
  personality: "marites" | "formal" = "marites",
): Promise<FactCheckResult | null> {
  const serperApiKey = process.env.SERPER_API_KEY;

  if (!serperApiKey || serperApiKey === "your_serper_api_key_here") {
    console.log("[SEARCH] ⚠️ SERPER_API_KEY missing. Skipping fact-check.");
    return null;
  }

  try {
    console.log("[SEARCH] 🧠 Generating search query from text...");
    const query = await generateSearchQuery(text, personality);


    if (!query || query === "NO_SEARCH_NEEDED") {
      console.log(
        "[SEARCH] ⏭️ AI determined no search is needed for this text.",
      );
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
        num: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[SEARCH] SerperDev API Error:", errorData);
      return null;
    }

    const data = await response.json();

    if (!data.organic || data.organic.length === 0) {
      console.log("[SEARCH] 📭 No relevant search results found.");
      return {
        rawSources: [],
        formatted: "NO SEARCH RESULTS FOUND FOR THIS CLAIM.",
      };
    }

    console.log(`[SEARCH] ✅ Found ${data.organic.length} search results.`);

    const rawSources: SearchSource[] = data.organic.map(
      (item: SearchSource) => ({
        title: item.title || "",
        snippet: item.snippet || "",
        link: item.link || "",
      }),
    );

    const formatted = rawSources
      .map((item, index) => {
        return `Source ${index + 1}:\nTitle: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}\n`;
      })
      .join("\n");


    return { rawSources, formatted };
  } catch (error) {
    console.error("[SEARCH] ❌ Fact-checking failed:", error);
    return null;
  }
}
