/**
 * /api/analyze — POST route for ChismiScan analysis
 *
 * Accepts:
 *   - multipart/form-data with a "file" field (image upload)
 *   - multipart/form-data with a "text" field (raw text input)
 *   - multipart/form-data with a "url" field (URL content extraction)
 *
 * Pipeline: Input → Extract → Search → AI Analysis → AnalysisResult JSON
 */

import { analyzeChismis, analyzeChismisText, analyzeChismisUrl } from "@/lib/chismis";

/** Max file size: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed image MIME types */
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

export async function POST(req: Request) {
  console.log("\n📡 [API] POST /api/analyze - Request received");
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;
    const url = formData.get("url") as string | null;
    const rawPersonality = formData.get("personality") as string | null;
    const personality = (rawPersonality === "formal" ? "formal" : "marites") as "marites" | "formal";

    // ─── URL Input Path ───────────────────────────────────────────────
    if (url && url.trim().length > 0) {
      console.log(`[API] 🌐 Detected URL input: ${url.trim()}`);
      const result = await analyzeChismisUrl(url.trim(), personality);
      console.log("[API] ✅ Returning URL analysis result");
      return Response.json(result);
    }

    // ─── Text Input Path ──────────────────────────────────────────────
    if (text && text.trim().length > 0) {
      console.log("[API] 📝 Detected text input");
      const result = await analyzeChismisText(text.trim(), personality);
      console.log("[API] ✅ Returning text analysis result");
      return Response.json(result);
    }

    // ─── Image Upload Path ────────────────────────────────────────────
    if (!file) {
      console.log("[API] ❌ No file or text provided");
      return Response.json(
        { error: "No file or text provided. Please upload an image or enter text." },
        { status: 400 }
      );
    }

    console.log(`[API] 🖼️ Detected image upload: ${file.name} (${file.type})`);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log(`[API] ❌ Unsupported file type: ${file.type}`);
      return Response.json(
        {
          error: `Unsupported file type: ${file.type}. Please upload a PNG, JPEG, WebP, or GIF image.`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log(`[API] ❌ File too large: ${file.size} bytes`);
      return Response.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run the full pipeline: OCR → AI → Result
    const result = await analyzeChismis(buffer, file.type, personality);
    
    console.log("[API] ✅ Returning image analysis result");
    return Response.json(result);
  } catch (error) {
    console.error("❌ [API] Error in /api/analyze:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Return user-friendly error
    return Response.json(
      {
        error: message.includes("API_KEY")
          ? "Server configuration error. Please contact the administrator."
          : `Analysis failed: ${message}`,
      },
      { status: 500 }
    );
  }
}
