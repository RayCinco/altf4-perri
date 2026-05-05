import { NextResponse } from "next/server";

type Source = {
  title: string;
  url: string;
  outlet: string;
  trustLevel: "trusted" | "questionable" | "unreliable";
};

type MediaLiteracyItem = {
  label: string;
  verdict: "pass" | "warn" | "fail";
  detail: string;
};

type AnalysisResult = {
  sources: Source[];
  mediaLiteracy: MediaLiteracyItem[];
  chismisScore: number;
  classification: "fact" | "opinion" | "chismis";
};

const SENSATIONAL_WORDS = [
  "breaking",
  "shocking",
  "secret",
  "viral",
  "exclusive",
  "unbelievable",
  "must read",
  "never",
  "always",
  "can't believe",
  "you won't believe",
  "claim",
  "alert",
  "urgent",
  "crisis",
  "scandal",
  "exposed",
  "revealed",
];

const TRUSTED_KEYWORDS = [
  "official",
  "government",
  "verified",
  "fact-check",
  "confirmed",
  "denied",
  "statement",
  "press release",
  "authority",
  "agency",
  "department",
];

const UNRELIABLE_KEYWORDS = [
  "rumor",
  "unverified",
  "anonymous",
  "source says",
  "allegedly",
  "claimed",
  "reportedly",
  "hearsay",
];

function scoreText(text: string): number {
  const normalized = text.trim().toLowerCase();
  let score = 30; // Base score

  // Length factors
  if (normalized.length < 50) score += 15;
  if (normalized.length > 300) score -= 10;

  // Sensational language
  SENSATIONAL_WORDS.forEach((word) => {
    if (normalized.includes(word)) score += 8;
  });

  // Trusted indicators
  TRUSTED_KEYWORDS.forEach((word) => {
    if (normalized.includes(word)) score -= 12;
  });

  // Unreliable indicators
  UNRELIABLE_KEYWORDS.forEach((word) => {
    if (normalized.includes(word)) score += 10;
  });

  // Punctuation overload
  const exclamationCount = (normalized.match(/!/g) || []).length;
  const questionCount = (normalized.match(/\?/g) || []).length;
  if (exclamationCount > 2) score += 10;
  if (questionCount > 3) score += 5;

  // Capitalization (all caps sections)
  const capsSections = normalized.split(/\s+/).filter(word => word === word.toUpperCase() && word.length > 3);
  score += capsSections.length * 5;

  return Math.min(100, Math.max(0, score));
}

function classifyScore(score: number): AnalysisResult["classification"] {
  if (score > 65) return "chismis";
  if (score > 35) return "opinion";
  return "fact";
}

function buildMediaLiteracy(text: string): MediaLiteracyItem[] {
  const normalized = text.trim().toLowerCase();

  const hasTrustedKeywords = TRUSTED_KEYWORDS.some(word => normalized.includes(word));
  const hasUnreliableKeywords = UNRELIABLE_KEYWORDS.some(word => normalized.includes(word));
  const hasSensational = SENSATIONAL_WORDS.some(word => normalized.includes(word));

  return [
    {
      label: "Source authority",
      verdict: hasTrustedKeywords ? "pass" : hasUnreliableKeywords ? "fail" : "warn",
      detail: hasTrustedKeywords
        ? "The content references official sources or verified information."
        : hasUnreliableKeywords
        ? "The content relies on anonymous or unverified sources."
        : "Source credibility is unclear from the provided text.",
    },
    {
      label: "Cross-verification",
      verdict: hasTrustedKeywords ? "pass" : "warn",
      detail: hasTrustedKeywords
        ? "Official sources mentioned allow for cross-verification."
        : "Limited indicators for verifying this information independently.",
    },
    {
      label: "Emotional language",
      verdict: hasSensational ? "fail" : "pass",
      detail: hasSensational
        ? "The text uses sensational or emotionally charged language, common in misinformation."
        : "The language appears measured and factual.",
    },
    {
      label: "Official statement",
      verdict: normalized.includes("official") || normalized.includes("denied") || normalized.includes("confirmed") ? "pass" : "warn",
      detail: normalized.includes("official") || normalized.includes("denied") || normalized.includes("confirmed")
        ? "References to official statements or confirmations are present."
        : "No clear official response or statement is mentioned.",
    },
    {
      label: "Publication date",
      verdict: normalized.includes("today") || normalized.includes("recent") || normalized.includes("hour") || /\d{4}-\d{2}-\d{2}/.test(normalized) ? "pass" : "warn",
      detail: /\d{4}-\d{2}-\d{2}/.test(normalized) || normalized.includes("today") || normalized.includes("recent") || normalized.includes("hour")
        ? "The content references recent or dated information."
        : "Time frame is unclear, making verification harder.",
    },
  ];
}

function buildSources(type: string, content: string): Source[] {
  const normalized = content.trim().toLowerCase();

  const sources: Source[] = [];

  if (normalized.includes("rappler") || normalized.includes("inquirer") || normalized.includes("gma") || normalized.includes("official")) {
    sources.push({
      title: "Official statement from Philippine News Agency",
      outlet: "Philippine News Agency",
      url: "https://www.pna.gov.ph",
      trustLevel: "trusted",
    });
  }

  if (normalized.includes("facebook") || normalized.includes("twitter") || normalized.includes("social media")) {
    sources.push({
      title: "Social media discussion on the claim",
      outlet: "Facebook",
      url: "https://www.facebook.com",
      trustLevel: "questionable",
    });
  }

  if (normalized.includes("rumor") || normalized.includes("unverified")) {
    sources.push({
      title: "Fact-check: Investigation into viral claims",
      outlet: "Rappler",
      url: "https://www.rappler.com",
      trustLevel: "trusted",
    });
  }

  // Default sources if none match
  if (sources.length === 0) {
    sources.push(
      {
        title: "General news coverage",
        outlet: "Inquirer.net",
        url: "https://www.inquirer.net",
        trustLevel: "trusted",
      },
      {
        title: "Community discussion",
        outlet: "Reddit",
        url: "https://www.reddit.com",
        trustLevel: "questionable",
      }
    );
  }

  return sources.slice(0, 4); // Limit to 4 sources
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { type, text, url } = body as {
    type: string;
    text?: string;
    url?: string;
  };

  if (type === "text") {
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text input is required for analysis." }, { status: 400 });
    }
  } else if (type === "url") {
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "URL is required for analysis." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Unsupported analysis type." }, { status: 400 });
  }

  const content = type === "text" ? text!.trim() : url!.trim();
  const chismisScore = scoreText(content);
  const classification = classifyScore(chismisScore);
  const mediaLiteracy = buildMediaLiteracy(content);
  const sources = buildSources(type, content);

  const result: AnalysisResult = {
    sources,
    mediaLiteracy,
    chismisScore,
    classification,
  };

  return NextResponse.json(result);
}
