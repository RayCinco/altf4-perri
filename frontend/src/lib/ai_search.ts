/**
 * ai_search.ts — SerperDev Search Fact-Checking Engine
 *
 * Handles generating search queries from unstructured text and
 * querying the SerperDev API to retrieve context
 * for the AI to use in its final verdict.
 */

import { executeFactCheck } from "./search/factCheck";
import { formatSearchContextPrompt, formatUserPrompt } from "./search/prompts";

export type { FactCheckResult } from "./search/factCheck";

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
export { executeFactCheck };

// ─── Prompt Formatters ────────────────────────────────────────────────────────

/**
 * Formats the search context to be appended to the user prompt.
 */
export { formatSearchContextPrompt, formatUserPrompt };
