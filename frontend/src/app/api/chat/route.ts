import { NextResponse } from "next/server";
import { generateMaritesReply } from "../../../lib/ai_chatbot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage: string = body?.message || "";

    try {
      const reply = await generateMaritesReply(userMessage);
      return NextResponse.json({ reply });
    } catch (e) {
      console.error("Gemini chat error:", e);
      return NextResponse.json({
        reply: "Sus mhie, nagka-problema ako sa AI request. Try ulit ha.",
        error: "Fetch failed",
      });
    }
  } catch (err) {
    return NextResponse.json(
      {
        reply: "Ayy girl, invalid request pero try again lang.",
        error: "Invalid request",
      },
      { status: 200 },
    );
  }
}
