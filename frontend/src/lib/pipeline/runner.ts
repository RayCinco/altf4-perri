/**
 * Production pipeline runner.
 *
 * Keeps input acquisition separate from verification/search/mapping.
 */

import type { AnalysisResult } from "@/app/types/analysis";
import { verifyClaim } from "../ai/verifier";
import { PipelineLogger } from "../logger";
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
  const logger = new PipelineLogger("image");

  console.log("----------------------------------------");
  console.log("[PIPELINE] 📸 Starting ChismiScan Image Pipeline");
  console.log(
    `[PIPELINE] 📦 Image type: ${mimeType}, Size: ${imageBuffer.length} bytes`,
  );

  logger.log("PIPELINE", "Image pipeline started", {
    mimeType,
    imageSizeBytes: imageBuffer.length,
  });

  try {
    console.log("[PIPELINE] ➡️ Step 1: Running OCR");
    const extractedText = await extractText(imageBuffer, mimeType, logger);

    const result = await runCoreAnalysis(
      extractedText,
      personality,
      logger,
      "image",
      "Image Analysis",
    );

    console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
    console.log("----------------------------------------");
    await logger.save();
    return result;
  } catch (error) {
    logger.log("ERROR", "Pipeline failed with exception", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await logger.save();
    throw error;
  }
}

export async function runTextAnalysis(
  text: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  const logger = new PipelineLogger("text");

  console.log("----------------------------------------");
  console.log("[PIPELINE] 📝 Starting ChismiScan Text Pipeline");

  logger.log("PIPELINE", "Text pipeline started", {
    inputText: text,
    inputTextLength: text.length,
  });

  try {
    const result = await runCoreAnalysis(
      text,
      personality,
      logger,
      "text",
      text,
    );

    console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
    console.log("----------------------------------------");
    await logger.save();
    return result;
  } catch (error) {
    logger.log("ERROR", "Pipeline failed with exception", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await logger.save();
    throw error;
  }
}

export async function runUrlAnalysis(
  url: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  const logger = new PipelineLogger("url");

  console.log("----------------------------------------");
  console.log("[PIPELINE] 🌐 Starting ChismiScan URL Pipeline");
  console.log(`[PIPELINE] 🔗 URL: ${url}`);

  logger.log("PIPELINE", "URL pipeline started", {
    inputUrl: url,
  });

  try {
    console.log("[PIPELINE] ➡️ Step 1: Fetching & Extracting URL Content");
    const urlResult = await extractFromUrl(url, logger);
    const extractedText = `[Title: ${urlResult.title}]\n[Source: ${urlResult.domain}]\n\n${urlResult.content}`;

    console.log(
      `[PIPELINE] 📄 Extracted ${extractedText.length} chars from URL`,
    );

    const result = await runCoreAnalysis(
      extractedText,
      personality,
      logger,
      "url",
      url,
    );

    console.log("[PIPELINE] 🎉 URL Pipeline completed successfully!");
    console.log("----------------------------------------");
    await logger.save();
    return result;
  } catch (error) {
    logger.log("ERROR", "URL pipeline failed with exception", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await logger.save();
    throw error;
  }
}

async function runCoreAnalysis(
  extractedText: string,
  personality: "marites" | "formal",
  logger: PipelineLogger,
  inputType: AnalysisResult["inputType"],
  originalInput: string,
): Promise<AnalysisResult> {
  console.log("[PIPELINE] ➡️ Step 2: Running Search Fact-Check");
  const searchResult = await executeFactCheck(
    extractedText,
    logger,
    personality,
  );

  console.log("[PIPELINE] ➡️ Step 3: Filtering Sources by Credibility");
  let filteredSources: FilteredSources | null = null;
  let searchContext: string | undefined;

  if (searchResult && searchResult.rawSources.length > 0) {
    filteredSources = filterSources(searchResult.rawSources, logger);
    searchContext = filteredSources.formattedContext;
  }

  console.log("[PIPELINE] ➡️ Step 4: Running AI Analysis");
  const geminiResult = await verifyClaim(
    extractedText,
    searchContext,
    logger,
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
    logger,
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

  logger.log("OUTPUT", "Final result mapped for frontend", {
    classification: finalResult.classification,
    chismisLevel: finalResult.chismisLevel,
    message: finalResult.message,
    details: finalResult.details,
    breakdown: finalResult.breakdown,
    harmScore: finalResult.harmScore,
    maritesMode: finalResult.maritesMode,
    resibo: finalResult.resibo,
    linguisticFlags: finalResult.linguisticFlags,
    factCorrection: finalResult.factCorrection,
    sourceCredibility: finalResult.sourceCredibility,
    literacyLesson: finalResult.literacyLesson,
  });

  return finalResult;
}
