/**
 * ai.ts — Gemini AI Analysis for Chismis Detection
 *
 * Sends extracted text to Google Gemini with the ChismiScan system prompt.
 * Gemini acts as a multi-stage reasoning pipeline: claim extraction,
 * context interpretation, classification, and Marites-style response.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MARITES_PERSONALITY } from "./ai_personality";
import { formatUserPrompt, formatSearchContextPrompt } from "./ai_search";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The raw JSON structure returned by Gemini */
export interface GeminiResponse {
  label: "True" | "Suspicious" | "Fake";
  confidence: number;
  marites_explanation: string;
  claims: string[];
  evidence: string[];
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the core intelligence behind "Chismis AI", a Filipino gossip-analysis system designed to analyze screenshots or text and determine whether a claim is TRUE, SUSPICIOUS, or FAKE.

========================================
🎯 SYSTEM OBJECTIVE
========================================
Analyze user-provided content (image OCR text or raw text), extract meaningful claims, verify them using available context (e.g., search results), and produce a structured, explainable, and entertaining output.

========================================
🧠 INTERNAL PROCESSING PIPELINE
========================================

Step 1: TEXT CLEANING
- Normalize messy OCR text
- Remove noise, duplicates, broken words

Step 2: CLAIM EXTRACTION
- Identify key claims or statements
- Extract entities (people, places, events)
- Focus on verifiable assertions

Step 3: CONTEXT INTERPRETATION
- Evaluate if credible sources would support the claim
- Look for consistency and plausibility
- If no reliable sources exist, treat as weak or unverified claim

Step 4: CLASSIFICATION
Classify into one:
- TRUE → supported by credible sources or widely known facts
- SUSPICIOUS → unclear, conflicting, or insufficient evidence
- FAKE → no credible evidence or likely misinformation

Step 5: CONFIDENCE SCORING
- Assign a confidence score (0–100)
- Based on: presence of sources, consistency, clarity of claim

${MARITES_PERSONALITY}

========================================
📤 OUTPUT FORMAT (STRICT JSON)
========================================

Return ONLY this JSON structure, no other text:

{
  "label": "True | Suspicious | Fake",
  "confidence": number (0-100),
  "marites_explanation": "Taglish explanation here (2-4 sentences)",
  "claims": ["list of extracted claims"],
  "evidence": ["key findings or lack of sources"]
}

========================================
⚠️ CONSTRAINTS
========================================
- Do NOT invent facts
- Do NOT assume something is true without evidence
- Do NOT output outside the JSON format
- Keep explanation concise (2–4 sentences)`;

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
  searchContext?: string
): Promise<GeminiResponse> {
  console.log("[AI] 🧠 Starting AI analysis pipeline...");
  console.log(`[AI] 📝 Text to analyze: "${text.substring(0, 50)}..."`);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set it in your .env.local file."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build the user prompt
  let userPrompt = formatUserPrompt(text);

  if (searchContext) {
    console.log("[AI] 🔎 Including search context...");
    userPrompt += formatSearchContextPrompt(searchContext);
  }

  console.log("[AI] ⏳ Waiting for Gemini's verdict...");
  const result = await model.generateContent(userPrompt);
  const responseText = result.response.text().trim();
  console.log("[AI] 📩 Received response from Gemini");
  console.log(`[AI] 📜 Raw Response Preview: ${responseText.substring(0, 100).replace(/\n/g, ' ')}...`);

  return parseGeminiResponse(responseText);
}

// ─── Response Parser ─────────────────────────────────────────────────────────

/**
 * Parses Gemini's raw text response into a typed GeminiResponse.
 * Handles cases where Gemini wraps JSON in markdown code blocks.
 */
function parseGeminiResponse(responseText: string): GeminiResponse {
  // Strip markdown code fences if present (```json ... ```)
  let cleaned = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  try {
    console.log("[AI] ⚙️ Parsing Gemini JSON response...");
    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.label || typeof parsed.confidence !== "number") {
      throw new Error("Missing required fields in AI response");
    }

    // Normalize the label to expected values
    const normalizedLabel = normalizeLabel(parsed.label);
    console.log(`[AI] ✅ Final Verdict: ${normalizedLabel} (Confidence: ${parsed.confidence}%)`);

    return {
      label: normalizedLabel,
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      marites_explanation:
        parsed.marites_explanation || "Walang masabi si Marites... 🤔",
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", responseText);
    throw new Error(
      `Failed to parse AI response. Raw output: ${responseText.substring(0, 200)}`
    );
  }
}

/**
 * Normalizes label variations to the three expected values.
 */
function normalizeLabel(label: string): "True" | "Suspicious" | "Fake" {
  const lower = label.toLowerCase().trim();
  if (lower.includes("true") || lower.includes("legit")) return "True";
  if (lower.includes("fake") || lower.includes("false")) return "Fake";
  return "Suspicious";
}
