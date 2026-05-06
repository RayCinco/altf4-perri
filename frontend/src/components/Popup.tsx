"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types (mirrors AnalysisResult from analysis.ts + LiteracyLesson) ─────────

interface LiteracyPoint {
  issue: string;
  correction: string;
}

interface LiteracyLesson {
  summary: string;
  points: LiteracyPoint[];
  tip: string;
}

interface PopupSource {
  title: string;
  url: string;
  credibility: "verified" | "questionable" | "unknown";
}

export interface PopupResult {
  classification: "fact" | "opinion" | "chismis";
  chismisLevel: number;
  message: string;
  details: string;
  breakdown: {
    reasons: string[];
    redFlags: string[];
  };
  harmScore: {
    level: "low" | "medium" | "high";
    score: number;
    explanation: string;
  };
  resibo: {
    sources: PopupSource[];
    verdict: string;
  };
  literacyLesson: LiteracyLesson | null;
}

interface ResultsPanelProps {
  isOpen: boolean;
  result: PopupResult | null;
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
    const r = Math.min(W, (H * 1.0) / 2 - 10);

    ctx.clearRect(0, 0, W, H);

    // Draw arc segments: red (0–40), yellow (40–60), green (60–100)
    const segments = [
      { from: Math.PI, to: Math.PI * 1.4, color: "#ef4444" }, // 0–40 red
      { from: Math.PI * 1.4, to: Math.PI * 1.6, color: "#eab308" }, // 40–60 yellow
      { from: Math.PI * 1.6, to: Math.PI * 2, color: "#22c55e" }, // 60–100 green
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
          cy + Math.sin(angle) * labelR + 4,
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
      cy + Math.sin(needleAngle) * needleLen,
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
        <span style={{ fontSize: 18, color: "#64748b", marginLeft: 4 }}>
          /100
        </span>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CREDIBILITY_CONFIG = {
  verified: { label: "Verified", bg: "#14532d", color: "#86efac" },
  questionable: { label: "Questionable", bg: "#713f12", color: "#fde047" },
  unknown: { label: "Unknown", bg: "#1e293b", color: "#94a3b8" },
};

const HARM_COLOR = {
  low: {
    bg: "#0a2d15",
    border: "#14532d",
    badge: "#86efac",
    badgeBg: "#14532d",
  },
  medium: {
    bg: "#2d1f00",
    border: "#713f12",
    badge: "#fde047",
    badgeBg: "#713f12",
  },
  high: {
    bg: "#2d0a0a",
    border: "#7f1d1d",
    badge: "#fca5a5",
    badgeBg: "#7f1d1d",
  },
};

const CLASSIFICATION_COLOR = {
  fact: { bg: "#0a2d15", border: "#14532d", color: "#86efac" },
  opinion: { bg: "#2d1f00", border: "#713f12", color: "#fde047" },
  chismis: { bg: "#2d0a0a", border: "#7f1d1d", color: "#fca5a5" },
};

// ─── Active tab type ──────────────────────────────────────────────────────────

type Tab = "sources" | "literacy" | "analysis";

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function ResultsPanel({
  isOpen,
  result,
  onClose,
  onToggle,
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("sources");

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    zIndex: 50,
    height: "100%",
    width: "min(420px, 95vw)",
    background: "#0d1b2e",
    borderLeft: "1px solid #1e3a5f",
    transform: isOpen ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.4s cubic-bezier(0.3, 1, 0.3, 1)",
    boxShadow: "-8px 0 40px rgba(0,0,0,0.6)",
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "sources", label: "Sources" },
    { id: "literacy", label: "Media Literacy" },
    { id: "analysis", label: "Analysis" },
  ];

  return (
    <>
      {/* Sidebar panel — absolutely positioned within the main content area */}
      <div style={panelStyle} aria-hidden={!isOpen}>
        {/* Puller Cabinet Tab */}
        <button
          onClick={onToggle || onClose}
          style={{
            position: "absolute",
            left: "-40px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "40px",
            height: "80px",
            background: "#0d1b2e",
            border: "1px solid #1e3a5f",
            borderRight: "none",
            borderRadius: "12px 0 0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "-4px 0 10px rgba(0,0,0,0.3)",
            color: "#64748b",
            zIndex: 49,
          }}
          aria-label="Toggle panel"
        >
          {isOpen ? (
            <span style={{ fontSize: "16px" }}>▶</span>
          ) : (
            <span style={{ fontSize: "16px" }}>◀</span>
          )}
        </button>

        {/* Inner wrapper for overflow control */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
          {/* ── Header ── */}
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
              fontSize: 22,
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#e2e8f0")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#64748b")
            }
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #1e3a5f",
            flexShrink: 0,
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
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
          {!result ? (
            <div
              style={{
                color: "#475569",
                fontSize: 14,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              Run an analysis to see results here.
            </div>
          ) : (
            <>
              {/* ════════ SOURCES TAB ════════ */}
              {activeTab === "sources" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* Verdict banner */}
                  {result.resibo.verdict && (
                    <div
                      style={{
                        background:
                          CLASSIFICATION_COLOR[result.classification].bg,
                        border: `1px solid ${CLASSIFICATION_COLOR[result.classification].border}`,
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color:
                            CLASSIFICATION_COLOR[result.classification].color,
                        }}
                      >
                        Verdict
                      </span>
                      <p
                        style={{
                          color: "#cbd5e1",
                          fontSize: 13,
                          marginTop: 4,
                          lineHeight: 1.5,
                          marginBottom: 0,
                        }}
                      >
                        {result.resibo.verdict}
                      </p>
                    </div>
                  )}

                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: 13,
                      margin: "0 0 2px",
                    }}
                  >
                    {result.resibo.sources.length > 0
                      ? "Relevant sources found for this claim:"
                      : "No sources were found for this claim."}
                  </p>

                  {result.resibo.sources.map((src, i) => {
                    const cred = CREDIBILITY_CONFIG[src.credibility];
                    let hostname = src.url;
                    try {
                      hostname = new URL(src.url).hostname.replace("www.", "");
                    } catch {}
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
                              background: cred.bg,
                              color: cred.color,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 20,
                              flexShrink: 0,
                              letterSpacing: "0.03em",
                            }}
                          >
                            {cred.label}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 12, color: "#475569" }}>
                            {hostname}
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

              {/* ════════ MEDIA LITERACY TAB ════════ */}
              {activeTab === "literacy" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {!result.literacyLesson ? (
                    <div
                      style={{
                        color: "#475569",
                        fontSize: 14,
                        textAlign: "center",
                        marginTop: 40,
                      }}
                    >
                      No media literacy lesson available for this analysis.
                    </div>
                  ) : (
                    <>
                      {/* Summary card */}
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                          border: "1px solid #4338ca",
                          borderRadius: 12,
                          padding: "16px 18px",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}
                        >
                          📋
                        </span>
                        <div>
                          <div
                            style={{
                              color: "#a5b4fc",
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              marginBottom: 6,
                            }}
                          >
                            Media Literacy Check
                          </div>
                          <p
                            style={{
                              color: "#e0e7ff",
                              fontSize: 13,
                              lineHeight: 1.6,
                              margin: 0,
                            }}
                          >
                            {result.literacyLesson.summary}
                          </p>
                        </div>
                      </div>

                      {/* Teaching points (issue → correction pairs) */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {result.literacyLesson.points.map((point, i) => (
                          <div
                            key={i}
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <div
                              style={{
                                background: "#0f2340",
                                border: "1px solid #1e3a5f",
                                borderRadius: "10px 10px 0 0",
                                padding: "12px 16px",
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              >
                                🔍
                              </span>
                              <p
                                style={{
                                  color: "#94a3b8",
                                  fontSize: 13,
                                  lineHeight: 1.5,
                                  margin: 0,
                                }}
                              >
                                {point.issue}
                              </p>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                padding: "4px 0",
                                background: "#0a1929",
                              }}
                            >
                              <span style={{ color: "#1e3a5f", fontSize: 16 }}>
                                ↓
                              </span>
                            </div>
                            <div
                              style={{
                                background: "#071a0a",
                                border: "1px solid #14532d",
                                borderRadius: "0 0 10px 10px",
                                padding: "12px 16px",
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  flexShrink: 0,
                                  marginTop: 1,
                                  color: "#22c55e",
                                }}
                              >
                                ✓
                              </span>
                              <p
                                style={{
                                  color: "#86efac",
                                  fontSize: 13,
                                  lineHeight: 1.5,
                                  margin: 0,
                                }}
                              >
                                {point.correction}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick tip */}
                      <div
                        style={{
                          background: "#2d1f00",
                          border: "1px solid #713f12",
                          borderRadius: 10,
                          padding: "14px 16px",
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                        <div>
                          <div
                            style={{
                              color: "#fde047",
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              marginBottom: 4,
                            }}
                          >
                            Quick Tip
                          </div>
                          <p
                            style={{
                              color: "#fef9c3",
                              fontSize: 13,
                              lineHeight: 1.5,
                              margin: 0,
                            }}
                          >
                            {result.literacyLesson.tip}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ════════ ANALYSIS TAB ════════ */}
              {activeTab === "analysis" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {/* Gauge */}
                  <ChismisGauge score={result.chismisLevel} />

                  {/* Details */}
                  <div
                    style={{
                      background: "#0f2340",
                      border: "1px solid #1e3a5f",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Summary
                    </div>
                    <p
                      style={{
                        color: "#cbd5e1",
                        fontSize: 13,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {result.details}
                    </p>
                  </div>

                  {/* Supporting reasons */}
                  {result.breakdown.reasons.length > 0 && (
                    <div
                      style={{
                        background: "#0f2340",
                        border: "1px solid #1e3a5f",
                        borderRadius: 10,
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        Supporting Reasons
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {result.breakdown.reasons.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                            }}
                          >
                            <span
                              style={{
                                color: "#22c55e",
                                fontSize: 14,
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              ✓
                            </span>
                            <span
                              style={{
                                color: "#94a3b8",
                                fontSize: 13,
                                lineHeight: 1.5,
                              }}
                            >
                              {r}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Red flags */}
                  {result.breakdown.redFlags.length > 0 && (
                    <div
                      style={{
                        background: "#2d0a0a",
                        border: "1px solid #7f1d1d",
                        borderRadius: 10,
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          color: "#fca5a5",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        Red Flags
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {result.breakdown.redFlags.map((flag, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                            }}
                          >
                            <span
                              style={{
                                color: "#ef4444",
                                fontSize: 14,
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              ⚑
                            </span>
                            <span
                              style={{
                                color: "#fca5a5",
                                fontSize: 13,
                                lineHeight: 1.5,
                              }}
                            >
                              {flag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Harm score */}
                  <div
                    style={{
                      background: HARM_COLOR[result.harmScore.level].bg,
                      border: `1px solid ${HARM_COLOR[result.harmScore.level].border}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Harm Score
                      </div>
                      <span
                        style={{
                          background:
                            HARM_COLOR[result.harmScore.level].badgeBg,
                          color: HARM_COLOR[result.harmScore.level].badge,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {result.harmScore.level} — {result.harmScore.score}/100
                      </span>
                    </div>
                    <p
                      style={{
                        color: "#cbd5e1",
                        fontSize: 13,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {result.harmScore.explanation}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── End of file ─────────────────────────────────────────────────────────────
