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
Analyze user-provided content (image OCR text or raw text), extract meaningful claims, verify them using available context (e.g., search results), and produce a structured, explainable, and decisive output. Be straightforward — do not speculate or hedge when the evidence is clear.

========================================
🧠 INTERNAL PROCESSING PIPELINE
========================================

Step 0: CONTENT TYPE CLASSIFICATION (MANDATORY — DO THIS FIRST)
Before any fact-checking, determine what kind of input was submitted. This controls all downstream steps.

- TYPE 1 — NON-CLAIM / CONVERSATIONAL
  Definition: Greetings, random words, test inputs, questions with no verifiable assertion, jokes, or irrelevant text.
  Examples: "Hello!", "How are you?", "Test", "What's up?", "Hi there"
  → There is NOTHING to fact-check. This is pure ungrounded content.
  → label: "Suspicious", confidence: 90
  → chismis_level: 88-95 (no factual grounding = maximum gossip territory)
  → Explain clearly that no verifiable claim was found.
  → SKIP Steps 1-4. Proceed directly to scoring.

- TYPE 2 — PERSONAL OPINION / ANECDOTE
  Definition: First-person or third-person statements about personal identity, personal beliefs, or unverifiable private assertions.
  Examples: "I am Raymond Cinco", "My name is Maria", "I think taxes are too high", "My friend told me the mayor is corrupt"
  → These are opinions or personal statements. There is no public claim to verify.
  → label: "Suspicious", confidence: 85
  → chismis_level: 78-90 (personal/opinion content with no verifiable backing = high gossip range)
  → Explain that this is a personal statement or opinion, not a verifiable public claim.
  → SKIP Steps 1-4. Proceed directly to scoring.

- TYPE 3 — VERIFIABLE FACTUAL CLAIM
  Definition: News events, announcements, public figure actions, scientific claims, statistics, government policies.
  Examples: "No classes tomorrow in Metro Manila", "The president signed the tax reform bill", "COVID vaccine causes autism"
  → Proceed with the FULL pipeline (Steps 1-10).

- TYPE 4 — UNIVERSALLY KNOWN FACT OR OBVIOUS FALSEHOOD
  Definition: Claims that any informed person would immediately recognize as undeniably true or definitively false without needing sources.
  Examples of obvious falsehoods: "The earth is flat", "The sky is green", "The sun revolves around the earth", "Humans never landed on the moon"
  Examples of obvious truths: "The sky is blue", "Water is wet", "The earth is round"
  → Fast-track with decisive verdict. Do NOT hedge.
  → Obvious falsehood: label: "Fake", confidence: 97, chismis_level: 92-99
  → Obvious truth: label: "True", confidence: 97, chismis_level: 1-5
  → SKIP Steps 1-4. Proceed directly to scoring.

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

Step 4: SOURCE QUALITY AUDIT
Before classifying, explicitly evaluate every source in the provided search context.
For each source, ask:
  (a) Is it DIRECTLY about this specific claim? (not just a related topic)
  (b) Is the date/year TEMPORALLY CONSISTENT with the claim's timeframe?
  (c) What is its credibility tier? ([TRUSTED], [SEMI-TRUSTED], or [UNTRUSTED])

Then compute: verified_direct_sources = count of sources that satisfy ALL THREE of: trusted tier + directly relevant + temporally current.

Rules:
- Social media (Facebook, Twitter, TikTok, Instagram) = NEVER counts as a verified_direct_source
- Off-topic or stale articles = do NOT count even if from trusted outlets
- "NO CREDIBLE SEARCH RESULTS FOUND" in context = verified_direct_sources is 0

Step 5: CLASSIFICATION — STRICT RULES (apply first match, in order)
Do NOT speculate. Apply these rules decisively:

1. verified_direct_sources ≥ 2 AND no contradicting trusted source → TRUE
2. verified_direct_sources == 1 → SUSPICIOUS
3. Claim is DIRECTLY CONTRADICTED by ≥ 1 trusted source → FAKE
4. Claim is a well-known scientific, historical, or logical falsehood (e.g., flat earth, moon landing denial) → FAKE
5. verified_direct_sources == 0 AND claim is TYPE 1 or TYPE 2 → SUSPICIOUS
6. verified_direct_sources == 0, insufficient evidence → SUSPICIOUS

NEVER label as TRUE without at least 2 verified_direct_sources. When in doubt, use SUSPICIOUS — not TRUE.

Step 6: CONFIDENCE SCORING
- Assign a confidence score (0–100)
- Based on: verified_direct_sources count, source credibility, claim clarity
- verified_direct_sources ≥ 3 → 88-97
- verified_direct_sources == 2 → 78-88
- verified_direct_sources == 1 → 60-75
- verified_direct_sources == 0 → 80-92 (high confidence that it is unverified)

${personalityInstruction}

Step 8: CHISMIS LEVEL — STRICT ANCHORS (apply the matching anchor, do NOT drift to the middle)
The chismis_level represents how "chismis/gossip-like" the content is. Be decisive. Use these hard anchors:

ANCHOR TABLE (apply the FIRST matching rule):
│ Condition                                                              │ chismis_level range │
│ TYPE 1 input (conversational/random, no claim)                        │ 88 – 95             │
│ TYPE 2 input (personal opinion/anecdote, unverifiable)                │ 78 – 90             │
│ TYPE 4 obvious falsehood (flat earth, sky is green, etc.)             │ 92 – 99             │
│ TYPE 4 obvious truth (sky is blue, water is wet)                      │  1 – 5              │
│ Claim CONTRADICTED by 2+ trusted sources                              │ 85 – 95             │
│ Claim CONTRADICTED by 1 trusted source                                │ 75 – 88             │
│ 0 trusted/semi-trusted sources, no verification possible              │ 65 – 80             │
│ Only social media sources found                                       │ 70 – 85             │
│ Only 1 semi-trusted source (not directly relevant or stale)           │ 50 – 65             │
│ Only 1 semi-trusted source (directly relevant)                        │ 38 – 52             │
│ 1 trusted source, NOT directly relevant or stale                      │ 35 – 50             │
│ 1 trusted source, directly relevant and temporally current            │ 22 – 36             │
│ 2 trusted sources, directly relevant and current                      │  8 – 22             │
│ 3+ trusted sources, directly relevant and current                     │  1 – 10             │

RULES:
- NEVER assign chismis_level < 15 unless verified_direct_sources ≥ 2
- NEVER assign chismis_level < 5 unless verified_direct_sources ≥ 3
- NEVER assign chismis_level > 30 when verified_direct_sources ≥ 2
- Do NOT land on 50 as a default. Pick a number within the correct anchor range.
- Linguistic red flags (ALL CAPS, emotional manipulation) push toward the HIGH end of the applicable range
- Clean, formal writing with specific verifiable details pushes toward the LOW end

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
- TRUE + 2+ trusted sources → low harm (5-15)
- SUSPICIOUS + personal opinion → low-medium harm (20-40)
- SUSPICIOUS + unclear public claim → medium harm (35-55)
- FAKE + emotional manipulation + no sources → high harm (75-95)
- Conversational/random text → low harm (5-20, no claim to spread)

Step 10: FACT CORRECTION (ONLY when label is "Fake")
When a claim is classified as FAKE, you MUST provide a factual correction:
- State what the claim says vs what the evidence actually shows
- Base the correction ONLY on the provided search sources or universally established facts — do NOT invent facts
- Format: "The claim says [X], but according to [source / established science / historical record], [the actual fact is Y]."
- Keep it concise (1–2 sentences)
- If no search results are available to form a correction, set fact_correction to null
- For TYPE 4 obvious falsehoods, you MAY cite established scientific consensus even without a source in the search context

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
- linguistic_flags should be specific (e.g., "Excessive punctuation (!!!)" not just "suspicious")
- Do NOT default to chismis_level 50 — always apply the anchor table
- Be decisive: "The earth is flat" is 99% chismis. "The sky is blue" is 1% chismis. Do not hedge.`;
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
