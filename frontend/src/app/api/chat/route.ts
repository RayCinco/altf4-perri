import { NextResponse } from "next/server";
import { runTextAnalysis } from "../../../lib/pipeline/runner";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage: string = body?.message || "";

    if (!userMessage.trim()) {
      return NextResponse.json({
        reply: "Ayy girl, wala kang sinabi! Type ka naman ng chismis mo.",
        sources: [],
        factCorrection: null,
        literacyLesson: null,
      });
    }

    try {
      const result = await runTextAnalysis(userMessage, "marites");

      return NextResponse.json({
        reply: result.maritesMode,
        sources: result.resibo.sources,
        factCorrection: result.factCorrection,
        literacyLesson: result.literacyLesson,
      });
    } catch (e) {
      console.error("Perri chat pipeline error:", e);
      return NextResponse.json({
        reply: "Sus mhie, nagka-problema ako sa AI request. Try ulit ha.",
        sources: [],
        factCorrection: null,
        literacyLesson: null,
        error: "Fetch failed",
      });
    }
  } catch {
    return NextResponse.json(
      {
        reply: "Ayy girl, invalid request pero try again lang.",
        sources: [],
        factCorrection: null,
        literacyLesson: null,
        error: "Invalid request",
      },
      { status: 200 },
    );
  }
}
