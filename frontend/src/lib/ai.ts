/**
 * ai.ts — Gemini AI Analysis for Chismis Detection
 *
 * Sends extracted text to Google Gemini with the ChismiScan system prompt.
 * Gemini acts as a multi-stage reasoning pipeline: claim extraction,
 * linguistic analysis, context interpretation, classification,
 * fact correction, and Marites-style response.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MARITES_PERSONALITY, FORMAL_PERSONALITY } from "./ai_personality";
import { formatUserPrompt, formatSearchContextPrompt } from "./ai_search";
import type { PipelineLogger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The raw JSON structure returned by Gemini */
export interface GeminiResponse {
  label: "True" | "Suspicious" | "Fake";
  confidence: number;
  marites_explanation: string;
  claims: string[];
  evidence: string[];
  /** Suspicious writing patterns detected in the original text */
  linguistic_flags: string[];
  /** Factual correction when label is "Fake" — null if no correction available */
  fact_correction: string | null;
  /** AI-calculated chismis level (1-100) based on claim, evidence quality, and source credibility */
  chismis_level: number;
  /** AI-calculated harm score with level, numeric score, and explanation */
  harm_score: {
    level: "low" | "medium" | "high";
    score: number;
    explanation: string;
  };
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function getSystemPrompt(personality: "marites" | "formal"): string {
  const personalityInstruction =
    personality === "formal" ? FORMAL_PERSONALITY : MARITES_PERSONALITY;

  return `You are the core intelligence behind "Chismis AI", a Filipino gossip-analysis system designed to analyze screenshots or text and determine whether a claim is TRUE, SUSPICIOUS, or FAKE.

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

Step 3: LINGUISTIC / WRITING ANALYSIS
Analyze the claim itself for suspicious writing patterns:
- Detect ALL CAPS usage or excessive capitalization
- Identify excessive punctuation (!!!, ???, ...)
- Flag emotional manipulation language ("SHOCKING!", "BREAKING!", "OMG!", "GRABE!")
- Detect vague attribution ("sources say", "they confirmed", "ayon sa insider")
- Identify urgency/pressure language ("share before deleted!", "viral na!", "last chance!")
- Check for lack of specific dates, names, or verifiable details
- Detect logical inconsistencies within the text
- Flag sensationalist or clickbait-style phrasing
Report each detected pattern as a short, specific flag string.
If no suspicious patterns are detected, return an empty array.

Step 4: CONTEXT INTERPRETATION
- Evaluate if credible sources would support the claim
- Look for consistency and plausibility
- Pay attention to source credibility tags ([TRUSTED] vs [SEMI-TRUSTED])
- If no reliable sources exist, treat as weak or unverified claim
- Give more weight to trusted sources than semi-trusted ones
- CRITICAL — TEMPORAL RELEVANCE: Check the dates/years mentioned in each source snippet. An article from a DIFFERENT month or year about the same general topic does NOT confirm a current specific claim. For example, "no classes September 22, 2023" does NOT confirm "no classes today". Off-topic or stale sources must be ignored.
- CRITICAL — SOCIAL MEDIA EVIDENCE: If the only supporting sources are Facebook, Twitter, TikTok, Instagram, or other social media platforms (flagged in context as untrusted or absent from context entirely), treat the claim as SUSPICIOUS at minimum. Social media posts are NOT credible evidence.
- CRITICAL — SOURCE COUNT & QUALITY: A single semi-trusted source is weak evidence. Multiple credible, temporally-relevant, topically-matching sources are required to classify something as TRUE.
- If context says "NO CREDIBLE SEARCH RESULTS FOUND" — do NOT classify as TRUE. Default to SUSPICIOUS unless the claim is a universally known fact with no room for doubt.
- If context mentions social media sources were found but excluded — this is a signal the primary "evidence" is unverified; lean toward SUSPICIOUS.

Step 5: CLASSIFICATION
Classify into one:
- TRUE → supported by MULTIPLE credible sources that are (a) from trusted/established outlets, (b) temporally relevant to the specific claim, and (c) directly address the claim — not just a related topic from a different period.
- SUSPICIOUS → unclear, conflicting, or insufficient evidence. Use this when: only 1 source exists, sources are semi-trusted only, sources are off-topic or dated, primary evidence is social media, or context shows no credible sources.
- FAKE → no credible evidence found, claim is contradicted by sources, or clear misinformation patterns are detected.

Step 6: CONFIDENCE SCORING
- Assign a confidence score (0–100)
- Based on: presence of sources, source credibility, consistency, clarity of claim

${personalityInstruction}

Step 8: CHISMIS LEVEL CALCULATION (1-100)
Calculate a chismis_level score representing how "chismis-like" the claim is:
- Lower score (1-30): Solid facts with multiple trusted sources, no red flags
- Medium score (31-65): Unverified claims, opinion pieces, partial evidence, questionable sources
- High score (66-100): Misinformation, fake news, no credible sources, heavy linguistic manipulation

Consider ALL these factors:
- Source quality: Trusted sources (news outlets, government, academic) lower the score; social media-only sources raise it significantly
- Source count: Multiple independent trusted sources → lower score; single source or no sources → higher score  
- Temporal relevance: Recent, topic-specific sources → lower score; old/off-topic sources → higher score
- Linguistic red flags: ALL CAPS, excessive punctuation, emotional manipulation, vague attribution → raise score
- Claim clarity: Specific, verifiable details → lower score; vague, sensationalist → higher score
- Evidence consistency: Sources agree → lower score; contradictory or absent evidence → higher score

Step 9: HARM SCORE CALCULATION (1-100 + level + explanation)
Calculate a harm_score representing the potential damage from sharing this content:
- level: "low" (1-30), "medium" (31-65), "high" (66-100)
- score: Numeric 1-100
- explanation: 1-2 sentence reasoning for the harm level

Consider:
- Misinformation severity: How misleading is it? Could it cause real-world harm?
- Urgency/manipulation: Does it pressure people to act/share quickly?
- Target vulnerability: Does it exploit emotions, fear, or specific groups?
- Verifiability: How easy is it for an average person to fact-check?

Examples:
- TRUE + trusted sources → low harm (5-15)
- SUSPICIOUS + unclear claims → medium harm (35-55)  
- FAKE + emotional manipulation + no sources → high harm (75-95)

Step 10: FACT CORRECTION (ONLY when label is "Fake")
When a claim is classified as FAKE, you MUST provide a factual correction:
- State what the claim says vs what the evidence actually shows
- Base the correction ONLY on the provided search sources — do NOT invent facts
- Format: "The claim says [X], but according to [source], [the actual fact is Y]."
- Keep it concise (1–2 sentences)
- If no search results are available to form a correction, set fact_correction to null

========================================
📤 OUTPUT FORMAT (STRICT JSON)
========================================

Return ONLY this JSON structure, no other text:

{
  "label": "True | Suspicious | Fake",
  "confidence": number (0-100),
  "marites_explanation": "Explanation here (2-4 sentences, adapt to requested tone)",
  "claims": ["list of extracted claims"],
  "evidence": ["key findings or lack of sources"],
  "linguistic_flags": ["list of detected suspicious writing patterns, or empty array"],
  "fact_correction": "factual correction string when label is Fake, or null",
  "chismis_level": number (1-100),
  "harm_score": {
    "level": "low | medium | high",
    "score": number (1-100),
    "explanation": "1-2 sentence harm reasoning"
  }
}

========================================
⚠️ CONSTRAINTS
========================================
- Do NOT invent facts
- Do NOT assume something is true without evidence
- Do NOT output outside the JSON format
- Keep explanation concise (2–4 sentences)
- fact_correction MUST be null when label is NOT "Fake"
- linguistic_flags should be specific (e.g., "Excessive punctuation (!!!)" not just "suspicious")`;
}

// ─── Main Analysis Function ──────────────────────────────────────────────────

/**
 * Analyzes extracted text using Google Gemini AI.
 *
 * @param text          - The extracted/cleaned text to analyze
 * @param searchContext - Optional search results for fact-checking context
 * @param logger        - Optional pipeline logger to record AI steps
 * @returns Parsed GeminiResponse with classification, confidence, and explanation
 * @throws Error if the API key is missing, Gemini fails, or response is unparseable
 */
export async function analyzeWithGemini(
  text: string,
  searchContext?: string,
  logger?: PipelineLogger,
  personality: "marites" | "formal" = "marites",
): Promise<GeminiResponse> {
  console.log(
    `[AI] 🧠 Starting AI analysis pipeline... (Personality: ${personality})`,
  );
  console.log(`[AI] 📝 Text to analyze: "${text.substring(0, 50)}..."`);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set it in your .env.local file.",
    );
  }

  const systemPrompt = getSystemPrompt(personality);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  // Build the user prompt
  let userPrompt = formatUserPrompt(text);

  if (searchContext) {
    console.log("[AI] 🔎 Including search context...");
    userPrompt += formatSearchContextPrompt(searchContext);
  }

  logger?.log("AI", "Prompts constructed", {
    personality,
    userPrompt,
    hasSearchContext: !!searchContext,
  });

  console.log("[AI] ⏳ Waiting for Gemini's verdict...");
  const result = await model.generateContent(userPrompt);
  const responseText = result.response.text().trim();
  console.log("[AI] 📩 Received response from Gemini");
  console.log(
    `[AI] 📜 Raw Response Preview: ${responseText.substring(0, 100).replace(/\n/g, " ")}...`,
  );

  logger?.log("AI", "Raw Gemini response received", {
    rawResponse: responseText,
  });

  const parsed = parseGeminiResponse(responseText);

  logger?.log("AI", "Response parsed successfully", {
    label: parsed.label,
    confidence: parsed.confidence,
    explanation: parsed.marites_explanation,
    claims: parsed.claims,
    evidence: parsed.evidence,
    linguisticFlags: parsed.linguistic_flags,
    factCorrection: parsed.fact_correction,
    chismisLevel: parsed.chismis_level,
    harmScore: parsed.harm_score,
  });

  return parsed;
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
    console.log(
      `[AI] ✅ Final Verdict: ${normalizedLabel} (Confidence: ${parsed.confidence}%)`,
    );

    if (parsed.linguistic_flags?.length > 0) {
      console.log(
        `[AI] 🔍 Linguistic flags: ${parsed.linguistic_flags.join(", ")}`,
      );
    }

    if (parsed.fact_correction) {
      console.log(
        `[AI] ✏️ Fact correction: ${parsed.fact_correction.substring(0, 80)}...`,
      );
    }

    return {
      label: normalizedLabel,
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      marites_explanation:
        parsed.marites_explanation || "Walang masabi si Marites... 🤔",
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      linguistic_flags: Array.isArray(parsed.linguistic_flags)
        ? parsed.linguistic_flags
        : [],
      fact_correction:
        typeof parsed.fact_correction === "string"
          ? parsed.fact_correction
          : null,
      chismis_level: Math.min(100, Math.max(1, parsed.chismis_level || 50)),
      harm_score: {
        level: parsed.harm_score?.level || "medium",
        score: Math.min(100, Math.max(1, parsed.harm_score?.score || 50)),
        explanation:
          parsed.harm_score?.explanation || "Unable to assess harm level.",
      },
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", responseText);
    throw new Error(
      `Failed to parse AI response. Raw output: ${responseText.substring(0, 200)}`,
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
