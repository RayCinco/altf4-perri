import { useState, useEffect, useRef } from "react";

// --- Types ---
interface Source {
  title: string;
  url: string;
  outlet: string;
  trustLevel: "trusted" | "questionable" | "unreliable";
}

interface MediaLiteracyItem {
  label: string;
  verdict: "pass" | "warn" | "fail";
  detail: string;
}

interface AnalysisResult {
  sources: Source[];
  mediaLiteracy: MediaLiteracyItem[];
  chismisScore: number; // 0–100: higher = more rumor-like
}

interface ResultsPanelProps {
  isOpen: boolean;
  result: AnalysisResult | null;
  onClose: () => void;
  onToggle?: () => void;
}

// --- Gauge Component ---
function ChismisGauge({ score }: { score: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H - 20;
    const r = Math.min(W, H * 1.8) / 2 - 10;

    ctx.clearRect(0, 0, W, H);

    // Draw arc segments: red (0–40), yellow (40–60), green (60–100)
    const segments = [
      { from: Math.PI, to: Math.PI * 1.4, color: "#ef4444" },   // 0–40 red
      { from: Math.PI * 1.4, to: Math.PI * 1.6, color: "#eab308" }, // 40–60 yellow
      { from: Math.PI * 1.6, to: Math.PI * 2, color: "#22c55e" },  // 60–100 green
    ];

    segments.forEach(({ from, to, color }) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, from, to);
      ctx.lineWidth = 20;
      ctx.strokeStyle = color;
      ctx.stroke();
    });

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI + (i / 10) * Math.PI;
      const inner = r - 14;
      const outer = r + 4;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(cx + cos * inner, cy + sin * inner);
      ctx.lineTo(cx + cos * outer, cy + sin * outer);
      ctx.lineWidth = i % 5 === 0 ? 2 : 1;
      ctx.strokeStyle = "#94a3b8";
      ctx.stroke();

      // Labels at 0, 50, 100
      if (i === 0 || i === 5 || i === 10) {
        ctx.font = "11px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        const labelR = r + 18;
        ctx.fillText(
          String(i * 10),
          cx + Math.cos(angle) * labelR,
          cy + Math.sin(angle) * labelR + 4
        );
      }
    }

    // Needle
    const clampedScore = Math.max(0, Math.min(100, score));
    const needleAngle = Math.PI + (clampedScore / 100) * Math.PI;
    const needleLen = r - 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(needleAngle) * needleLen,
      cy + Math.sin(needleAngle) * needleLen
    );
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineCap = "round";
    ctx.stroke();

    // Pivot dot
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#60a5fa";
    ctx.fill();
  }, [score]);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        width={260}
        height={140}
        style={{ maxWidth: "100%" }}
      />
      {/* Score label */}
      <div style={{ marginTop: -8 }}>
        <span
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: score < 40 ? "#ef4444" : score < 60 ? "#eab308" : "#22c55e",
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: 18, color: "#64748b", marginLeft: 4 }}>/100</span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          marginTop: 2,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {score < 40
          ? "Highly Likely Rumor"
          : score < 60
          ? "Uncertain — Verify"
          : "Likely Credible"}
      </div>
    </div>
  );
}

// --- Trust badge ---
const TRUST_CONFIG = {
  trusted: { label: "Trusted", bg: "#14532d", color: "#86efac" },
  questionable: { label: "Questionable", bg: "#713f12", color: "#fde047" },
  unreliable: { label: "Unreliable", bg: "#7f1d1d", color: "#fca5a5" },
};

// --- Verdict icon (CSS-only, no emoji) ---
function VerdictDot({ verdict }: { verdict: "pass" | "warn" | "fail" }) {
  const colors = { pass: "#22c55e", warn: "#eab308", fail: "#ef4444" };
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: colors[verdict],
        flexShrink: 0,
        marginTop: 3,
      }}
    />
  );
}

// --- Active tab type ---
type Tab = "sources" | "literacy" | "score";

// --- Main Panel ---
export default function ResultsPanel({ isOpen, result, onClose }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("sources");

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    width: 380,
    height: "100vh",
    background: "#0d1b2e",
    borderLeft: "1px solid #1e3a5f",
    display: "flex",
    flexDirection: "column",
    zIndex: 200,
    // Slide animation
    transform: isOpen ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
    overflowY: "auto",
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "sources", label: "Sources" },
    { id: "literacy", label: "Media Literacy" },
    { id: "score", label: "Analysis" },
  ];

  return (
    <div style={panelStyle} aria-hidden={!isOpen}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #1e3a5f",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15 }}>
          Analysis Results
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            fontSize: 20,
            lineHeight: 1,
            padding: "2px 6px",
            borderRadius: 6,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#e2e8f0")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#64748b")}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #1e3a5f",
          flexShrink: 0,
          gap: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: activeTab === tab.id ? "#132338" : "transparent",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              color: activeTab === tab.id ? "#60a5fa" : "#64748b",
              cursor: "pointer",
              padding: "12px 8px",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: "all 0.15s",
              letterSpacing: "0.01em",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "20px 20px", overflowY: "auto" }}>
        {!result ? (
          <div style={{ color: "#475569", fontSize: 14, textAlign: "center", marginTop: 40 }}>
            Run an analysis to see results here.
          </div>
        ) : (
          <>
            {/* SOURCES TAB */}
            {activeTab === "sources" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 4px" }}>
                  Relevant sources found for this claim:
                </p>
                {result.sources.map((src, i) => {
                  const trust = TRUST_CONFIG[src.trustLevel];
                  return (
                    <div
                      key={i}
                      style={{
                        background: "#0f2340",
                        border: "1px solid #1e3a5f",
                        borderRadius: 10,
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            color: "#cbd5e1",
                            fontSize: 14,
                            fontWeight: 500,
                            lineHeight: 1.4,
                            flex: 1,
                          }}
                        >
                          {src.title}
                        </span>
                        <span
                          style={{
                            background: trust.bg,
                            color: trust.color,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 20,
                            flexShrink: 0,
                            letterSpacing: "0.03em",
                          }}
                        >
                          {trust.label}
                        </span>
                      </div>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span style={{ fontSize: 12, color: "#475569" }}>
                          {src.outlet}
                        </span>
                        <span style={{ color: "#1e3a5f" }}>·</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            color: "#3b82f6",
                            textDecoration: "none",
                          }}
                        >
                          View source
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MEDIA LITERACY TAB */}
            {activeTab === "literacy" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 4px" }}>
                  Credibility indicators to help you evaluate this content:
                </p>
                {result.mediaLiteracy.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#0f2340",
                      border: "1px solid #1e3a5f",
                      borderRadius: 10,
                      padding: "14px 16px",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <VerdictDot verdict={item.verdict} />
                    <div>
                      <div
                        style={{
                          color: "#cbd5e1",
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 3,
                        }}
                      >
                        {item.label}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        {item.detail}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 8,
                    padding: "10px 14px",
                    background: "#0a1929",
                    borderRadius: 8,
                    border: "1px solid #1e3a5f",
                  }}
                >
                  {(["pass", "warn", "fail"] as const).map((v) => (
                    <div
                      key={v}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <VerdictDot verdict={v} />
                      <span style={{ fontSize: 12, color: "#475569" }}>
                        {v === "pass" ? "Credible" : v === "warn" ? "Uncertain" : "Suspicious"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHISMIS SCORE TAB */}
            {activeTab === "score" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Breakdown bars */}
                <div
                  style={{
                    background: "#0f2340",
                    border: "1px solid #1e3a5f",
                    borderRadius: 10,
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <span
                    style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    Score Breakdown
                  </span>
                  {[
                    { label: "Source Credibility", value: Math.round(result.chismisScore * 0.4) },
                    { label: "Sensationalism", value: Math.round(result.chismisScore * 0.35) },
                    { label: "Fact-check Matches", value: Math.round(result.chismisScore * 0.25) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>{label}</span>
                        <span style={{ fontSize: 13, color: "#60a5fa", fontWeight: 600 }}>
                          {value}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: "#1e3a5f",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${value}%`,
                            background:
                              value < 40 ? "#ef4444" : value < 60 ? "#eab308" : "#22c55e",
                            borderRadius: 99,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verdict card */}
                <div
                  style={{
                    background:
                      result.chismisScore < 40
                        ? "#2d0a0a"
                        : result.chismisScore < 60
                        ? "#2d1f00"
                        : "#0a2d15",
                    border: `1px solid ${
                      result.chismisScore < 40
                        ? "#7f1d1d"
                        : result.chismisScore < 60
                        ? "#713f12"
                        : "#14532d"
                    }`,
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                    }}
                  >
                    {result.chismisScore < 40
                      ? "This content shows strong indicators of being a rumor or misinformation. Cross-check with multiple verified sources before sharing."
                      : result.chismisScore < 60
                      ? "This content is unverified. Some indicators suggest it may be misleading. Verify with official sources before drawing conclusions."
                      : "This content appears to come from credible sources. Always read the full article and check publication dates before sharing."}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Demo wrapper so you can preview this component ---
const MOCK_RESULT: AnalysisResult = {
  chismisScore: 35,
  sources: [
    {
      title: "Fact-check: Viral claim about local water supply investigated",
      outlet: "Rappler",
      url: "https://www.rappler.com",
      trustLevel: "trusted",
    },
    {
      title: "Officials deny allegations circulating on social media",
      outlet: "Inquirer.net",
      url: "https://www.inquirer.net",
      trustLevel: "trusted",
    },
    {
      title: "Unverified thread claiming contamination goes viral",
      outlet: "Twitter / X",
      url: "https://twitter.com",
      trustLevel: "unreliable",
    },
    {
      title: "Community group raises questions about source accuracy",
      outlet: "Facebook Post",
      url: "https://facebook.com",
      trustLevel: "questionable",
    },
  ],
  mediaLiteracy: [
    {
      label: "Source authority",
      verdict: "fail",
      detail:
        "The primary source is an anonymous social media post with no verifiable author or institution behind it.",
    },
    {
      label: "Cross-verification",
      verdict: "warn",
      detail:
        "Only one major outlet covered this story and their report is still labeled as developing. More coverage needed.",
    },
    {
      label: "Emotional language",
      verdict: "fail",
      detail:
        "The original post uses fear-inducing language and all-caps claims — a common pattern in misinformation.",
    },
    {
      label: "Official statement",
      verdict: "pass",
      detail:
        "A government agency has issued a direct denial. While not conclusive, official records are publicly accessible.",
    },
    {
      label: "Publication date",
      verdict: "pass",
      detail: "The referenced news articles are recent and within a 48-hour window of the claim.",
    },
  ],
};

export function Demo() {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060e1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <ResultsPanel
        isOpen={open}
        result={MOCK_RESULT}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}