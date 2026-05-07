/**
 * Shared types for the AI analysis pipeline.
 */

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
