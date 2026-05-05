/**
 * media_literacy.ts — Media Literacy Teaching Module
 *
 * Generates concise, educational breakdowns that teach users
 * WHY a claim is classified the way it is, and what to look for
 * in credible vs non-credible sources. Powered by Gemini.
 *
 * This runs AFTER the main analysis is complete and uses the
 * analysis result + filtered sources to generate a short lesson.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PipelineLogger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single literacy teaching point */
export interface LiteracyPoint {
  /** What was wrong / what the user should notice */
  issue: string;
  /** What a credible version looks like */
  correction: string;
}

/** The full media literacy lesson output */
export interface LiteracyLesson {
  /** Overall summary (1 sentence) */
  summary: string;
  /** List of specific teaching points */
  points: LiteracyPoint[];
  /** Quick tip for next time */
  tip: string;
}

// ─── Literacy Generator ──────────────────────────────────────────────────────

const LITERACY_PROMPT = `You are a media literacy educator inside "Chismis AI", a Filipino fact-checking tool.

Your job: Given the analysis results of a claim, generate a SHORT, EDUCATIONAL breakdown that teaches the user how to evaluate claims and sources.

RULES:
1. Be concise — each point should be 1 sentence max.
2. Be specific — point to the EXACT words, patterns, or sources.
3. ADAPT TO CLASSIFICATION:
   - If the claim is FACTUAL: Highlight WHY it is factual. Your points should be "Observation -> Credibility" pairs. Point out the credible sources, exact wording, or evidence that makes it reliable. Do NOT invent errors or downgrade its factuality.
   - If the claim is NOT FACTUAL (chismis/suspicious/opinion): Highlight the errors. Your points should be "Issue -> Correction" pairs showing what's wrong and what a credible source would look like.
4. Use simple, accessible language (Taglish OK but keep it clear).
5. Maximum 4 teaching points.
6. Do NOT repeat the classification or verdict — focus on TEACHING.

Return ONLY this JSON, no other text:

{
  "summary": "One sentence summary of the media literacy lesson",
  "points": [
    {
      "issue": "If factual: What we verified (e.g. the specific source or exact wording). If not factual: What the user should notice is wrong (specific, 1 sentence).",
      "correction": "If factual: Why this makes it credible (1 sentence). If not factual: What a credible version looks like (specific, 1 sentence)."
    }
  ],
  "tip": "One quick actionable tip for next time"
}`;

/**
 * Generates a media literacy lesson based on the analysis results.
 *
 * @param originalText     - The original claim text that was analyzed
 * @param classification   - The AI's classification: "fact", "opinion", or "chismis"
 * @param linguisticFlags  - Detected writing pattern issues
 * @param evidence         - Evidence findings from the AI
 * @param topSources       - Top 3 most credible sources (for context)
 * @param logger           - Optional pipeline logger
 * @returns A structured LiteracyLesson, or null if generation fails
 */
export async function generateLiteracyLesson(
  originalText: string,
  classification: string,
  linguisticFlags: string[],
  evidence: string[],
  topSources: Array<{ title: string; url: string; credibility: string }>,
  logger?: PipelineLogger
): Promise<LiteracyLesson | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.log("[LITERACY] ⚠️ No API key, skipping literacy lesson.");
    return null;
  }

  try {
    console.log("[LITERACY] 📚 Generating media literacy lesson...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: LITERACY_PROMPT,
    });

    const userPrompt = `Analyze this claim and generate a media literacy lesson:

ORIGINAL TEXT:
"${originalText.substring(0, 500)}"

CLASSIFICATION: ${classification}

LINGUISTIC FLAGS DETECTED:
${linguisticFlags.length > 0 ? linguisticFlags.map((f) => `- ${f}`).join("\n") : "None detected"}

EVIDENCE FOUND:
${evidence.length > 0 ? evidence.map((e) => `- ${e}`).join("\n") : "No evidence found"}

CREDIBLE SOURCES AVAILABLE:
${topSources.length > 0 ? topSources.map((s) => `- [${s.credibility}] ${s.title}`).join("\n") : "No credible sources found"}

Generate the teaching breakdown now.`;

    logger?.log("LITERACY", "Generating literacy lesson", {
      classification,
      flagCount: linguisticFlags.length,
      sourceCount: topSources.length,
    });

    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text().trim();

    // Parse the response
    let cleaned = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(cleaned);

    const lesson: LiteracyLesson = {
      summary: parsed.summary || "Always verify before you share.",
      points: Array.isArray(parsed.points)
        ? parsed.points.slice(0, 4).map((p: any) => ({
            issue: p.issue || "",
            correction: p.correction || "",
          }))
        : [],
      tip: parsed.tip || "Check multiple credible sources before sharing.",
    };

    logger?.log("LITERACY", "Literacy lesson generated", {
      summary: lesson.summary,
      pointCount: lesson.points.length,
      tip: lesson.tip,
    });

    console.log(`[LITERACY] ✅ Generated ${lesson.points.length} teaching points`);

    return lesson;
  } catch (error) {
    console.error("[LITERACY] ❌ Failed to generate literacy lesson:", error);
    logger?.log("LITERACY", "Literacy lesson generation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
