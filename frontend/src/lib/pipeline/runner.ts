/**
 * Production pipeline runner.
 *
 * Keeps input acquisition separate from verification/search/mapping.
 */

import type { AnalysisResult } from "@/app/types/analysis";
import { verifyClaim } from "../ai/verifier";
import { generateLiteracyLesson } from "../media_literacy";
import { extractText } from "../ocr";
import { executeFactCheck } from "../search/factCheck";
import { filterSources, type FilteredSources } from "../source_filter";
import { extractFromUrl } from "../url";
import {
  getTopSources,
  mapClassification,
  mapToAnalysisResult,
} from "./resultMapper";

export async function runImageAnalysis(
  imageBuffer: Buffer,
  mimeType: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  console.log("----------------------------------------");
  console.log("[PIPELINE] 📸 Starting Perri AI Image Pipeline");
  console.log(
    `[PIPELINE] 📦 Image type: ${mimeType}, Size: ${imageBuffer.length} bytes`,
  );

  try {
    console.log("[PIPELINE] ➡️ Step 1: Running OCR");
    const extractedText = await extractText(imageBuffer, mimeType);

    const result = await runCoreAnalysis(
      extractedText,
      personality,
      "image",
      "Image Analysis",
    );

    console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
    console.log("----------------------------------------");
    return result;
  } catch (error) {
    console.error("[PIPELINE] ❌ Pipeline failed:", error);
    throw error;
  }
}

export async function runTextAnalysis(
  text: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  console.log("----------------------------------------");
  console.log("[PIPELINE] 📝 Starting Perri AI Text Pipeline");

  try {
    const result = await runCoreAnalysis(
      text,
      personality,
      "text",
      text,
    );

    console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
    console.log("----------------------------------------");
    return result;
  } catch (error) {
    console.error("[PIPELINE] ❌ Pipeline failed:", error);
    throw error;
  }
}

export async function runUrlAnalysis(
  url: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  console.log("----------------------------------------");
  console.log("[PIPELINE] 🌐 Starting Perri AI URL Pipeline");
  console.log(`[PIPELINE] 🔗 URL: ${url}`);

  try {
    console.log("[PIPELINE] ➡️ Step 1: Fetching & Extracting URL Content");
    const urlResult = await extractFromUrl(url);
    const extractedText = `[Title: ${urlResult.title}]\n[Source: ${urlResult.domain}]\n\n${urlResult.content}`;

    console.log(
      `[PIPELINE] 📄 Extracted ${extractedText.length} chars from URL`,
    );

    const result = await runCoreAnalysis(
      extractedText,
      personality,
      "url",
      url,
    );

    console.log("[PIPELINE] 🎉 URL Pipeline completed successfully!");
    console.log("----------------------------------------");
    return result;
  } catch (error) {
    console.error("[PIPELINE] ❌ URL pipeline failed:", error);
    throw error;
  }
}

async function runCoreAnalysis(
  extractedText: string,
  personality: "marites" | "formal",
  inputType: AnalysisResult["inputType"],
  originalInput: string,
): Promise<AnalysisResult> {
  console.log("[PIPELINE] ➡️ Step 2: Running Search Fact-Check");
  const searchResult = await executeFactCheck(
    extractedText,
    personality,
  );

  console.log("[PIPELINE] ➡️ Step 3: Filtering Sources by Credibility");
  let filteredSources: FilteredSources | null = null;
  let searchContext: string | undefined;

  if (searchResult && searchResult.rawSources.length > 0) {
    filteredSources = filterSources(searchResult.rawSources);
    searchContext = filteredSources.formattedContext;
  }

  console.log("[PIPELINE] ➡️ Step 4: Running AI Analysis");
  const geminiResult = await verifyClaim(
    extractedText,
    searchContext,
    personality,
  );

  console.log("[PIPELINE] ➡️ Step 5: Generating Media Literacy Lesson");
  const topSources = getTopSources(filteredSources, extractedText);
  const literacyLesson = await generateLiteracyLesson(
    extractedText,
    mapClassification(geminiResult.label),
    geminiResult.linguistic_flags,
    geminiResult.evidence,
    topSources.map((source) => ({
      title: source.title,
      url: source.link,
      credibility: source.credibility,
    })),
    personality,
  );

  console.log("[PIPELINE] ➡️ Step 6: Mapping output to AnalysisResult");
  const finalResult = mapToAnalysisResult(
    geminiResult,
    filteredSources,
    literacyLesson,
    personality,
    extractedText,
    inputType,
    originalInput,
  );

  return finalResult;
}

