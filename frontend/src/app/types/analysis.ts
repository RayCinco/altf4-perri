// TYPE (unchanged)
export interface AnalysisResult {
  classification: 'fact' | 'opinion' | 'chismis';
  chismisLevel: number;
  message: string;
  details: string;
  breakdown: {
    reasons: string[];
    redFlags: string[];
  };
  harmScore: {
    level: 'low' | 'medium' | 'high';
    score: number;
    explanation: string;
  };
  maritesMode: string;
  resibo: {
    sources: Array<{
      title: string;
      url: string;
      credibility: 'verified' | 'questionable' | 'unknown';
    }>;
    verdict: string;
  };
}

export async function analyzeImage(imageBase64: string): Promise<AnalysisResult> {
  // Simulate AI delay (optional but nice UX)
  await new Promise((res) => setTimeout(res, 1500));

  // MOCK LOGIC (replace later with OpenAI / API)
  const random = Math.random();

  if (random < 0.33) {
    return {
      classification: "fact",
      chismisLevel: 10,
      message: "Legit naman ‘to",
      details: "Supported by credible sources.",
      breakdown: {
        reasons: ["Backed by verified outlets", "Consistent reporting"],
        redFlags: [],
      },
      harmScore: {
        level: "low",
        score: 10,
        explanation: "Safe to share.",
      },
      maritesMode: "Ay confirmed bes, hindi chismis",
      resibo: {
        verdict: "Verified information.",
        sources: [
          {
            title: "Trusted News Source",
            url: "#",
            credibility: "verified",
          },
        ],
      },
    };
  }

  if (random < 0.66) {
    return {
      classification: "opinion",
      chismisLevel: 40,
      message: "Opinion lang ‘to",
      details: "No clear factual claim.",
      breakdown: {
        reasons: ["Subjective wording", "No verifiable claim"],
        redFlags: [],
      },
      harmScore: {
        level: "medium",
        score: 40,
        explanation: "Could mislead if taken as fact.",
      },
      maritesMode: "Parang opinion lang ‘to, wag masyado dibdibin",
      resibo: {
        verdict: "No factual basis required.",
        sources: [],
      },
    };
  }

  return {
    classification: "chismis",
    chismisLevel: 85,
    message: "CHISMIS ALERT",
    details: "Walang credible evidence.",
    breakdown: {
      reasons: ["No sources found", "Sensational language"],
      redFlags: ["Clickbait", "Unverified claim"],
    },
    harmScore: {
      level: "high",
      score: 85,
      explanation: "High risk of misinformation.",
    },
    maritesMode: "Sis parang gawa-gawa lang ‘to",
    resibo: {
      verdict: "No evidence found.",
      sources: [],
    },
  };
}