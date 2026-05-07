/**
 * Shared Gemini client helpers.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export function requireGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set it in your .env.local file.",
    );
  }

  return apiKey;
}

export function createGeminiModel(systemInstruction?: string) {
  const genAI = new GoogleGenerativeAI(requireGeminiApiKey());

  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}
