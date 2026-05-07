/**
 * ai.ts — Gemini AI Analysis for Chismis Detection
 *
 * Sends extracted text to Google Gemini with the ChismiScan system prompt.
 * Gemini acts as a multi-stage reasoning pipeline: claim extraction,
 * linguistic analysis, context interpretation, classification,
 * fact correction, and Marites-style response.
 */

import { verifyClaim } from "@/lib/ai/verifier";
export type { GeminiResponse } from "@/lib/ai/types";

// ─── Main Analysis Function ──────────────────────────────────────────────────

/**
 * Analyzes extracted text using Google Gemini AI.
 *
 * @param text          - The extracted/cleaned text to analyze
 * @param searchContext - Optional search results for fact-checking context
 * @returns Parsed GeminiResponse with classification, confidence, and explanation
 * @throws Error if the API key is missing, Gemini fails, or response is unparseable
 */
export async function analyzeWithGemini(
  text: string,
  searchContext?: string,
  personality: "marites" | "formal" = "marites",
) {
  return verifyClaim(text, searchContext, personality);
}

