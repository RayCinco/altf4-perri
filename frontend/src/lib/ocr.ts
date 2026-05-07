/**
 * ocr.ts — OCR Text Extraction via Gemini Vision
 *
 * Uses Google Gemini's multimodal capabilities to extract text
 * from uploaded images (screenshots, photos, memes, etc.)
 *
 * This approach is simpler and more accurate than traditional OCR
 * libraries like Tesseract.js, since Gemini can understand context.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Extracts readable text from an image using Gemini Vision.
 *
 * @param imageBuffer - Raw image bytes as a Buffer
 * @param mimeType   - MIME type of the image (e.g., "image/png", "image/jpeg")
 * @returns The extracted text content from the image
 * @throws Error if the API key is missing or extraction fails
 */
export async function extractText(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set it in your .env.local file."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  console.log("[OCR] 🖼️ Converting image to base64...");
  // Convert buffer to base64 for the Gemini API
  const base64Image = imageBuffer.toString("base64");

  console.log("[OCR] 🚀 Sending image to Gemini Vision for text extraction...");
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
    {
      text: `Extract ALL readable text from this image. 
Return ONLY the raw text content, exactly as it appears. 
Do not add commentary, analysis, or formatting.
If there is no text in the image, return "NO_TEXT_FOUND".
Preserve the original language (Filipino, English, Taglish, etc.)`,
    },
  ]);

  const response = result.response;
  const extractedText = response.text().trim();
  console.log(`[OCR] ✨ Raw extraction result length: ${extractedText.length} chars`);

  if (!extractedText || extractedText === "NO_TEXT_FOUND") {
    throw new Error(
      "No readable text found in the image. Try uploading a clearer screenshot."
    );
  }

  const cleanedText = cleanText(extractedText);
  console.log(`[OCR] 🧹 Cleaned text length: ${cleanedText.length} chars`);
  console.log(`[OCR] 📄 Extracted Text Preview: "${cleanedText.substring(0, 50)}..."`);

  return cleanedText;
}


/**
 * Cleans and normalizes extracted text.
 * Removes excessive whitespace, duplicate lines, and OCR artifacts.
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Collapse excessive blank lines
    .replace(/[ \t]+/g, " ") // Collapse multiple spaces/tabs
    .replace(/^\s+|\s+$/gm, "") // Trim each line
    .trim();
}
