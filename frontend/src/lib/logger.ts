/**
 * logger.ts — ChismiScan Pipeline Logger
 *
 * Records the full analysis pipeline for debugging and auditing:
 * prompts sent, data extracted, search results, AI responses, etc.
 * Each analysis run generates a structured JSON log file in /logs.
 */

import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single timestamped entry in the pipeline log */
export interface LogEntry {
  timestamp: string;
  step: string;
  label: string;
  data: Record<string, unknown>;
}

/** The full log file structure written to disk */
export interface PipelineLogFile {
  session: {
    id: string;
    mode: "image" | "text" | "url";
    startedAt: string;
    completedAt: string;
    durationMs: number;
  };
  pipeline: LogEntry[];
}

// ─── Pipeline Logger Class ───────────────────────────────────────────────────

/**
 * Captures every step of a single analysis run.
 *
 * Usage:
 *   const logger = new PipelineLogger("image");
 *   logger.log("OCR", "Extracted text", { text: "..." });
 *   logger.log("SEARCH", "Query generated", { query: "..." });
 *   await logger.save();
 */
export class PipelineLogger {
  private entries: LogEntry[] = [];
  private sessionId: string;
  private mode: "image" | "text" | "url";
  private startTime: Date;

  constructor(mode: "image" | "text" | "url") {
    this.startTime = new Date();
    this.mode = mode;
    this.sessionId = this.createSessionId();
    console.log(`[LOGGER] 📋 Session ${this.sessionId} started (${mode} mode)`);
  }

  /**
   * Adds a log entry for a pipeline step.
   *
   * @param step  - Pipeline stage (e.g., "OCR", "SEARCH", "AI", "OUTPUT")
   * @param label - Human-readable description of what happened
   * @param data  - Arbitrary data payload to capture
   */
  log(step: string, label: string, data: Record<string, unknown> = {}): void {
    this.entries.push({
      timestamp: new Date().toISOString(),
      step,
      label,
      data,
    });
  }

  /**
   * Writes the accumulated log entries to a JSON file in /logs.
   * Creates the directory if it doesn't exist.
   *
   * Filename format: YYYY-MM-DD_HH-MM-SS_<mode>_<sessionId>.json
   */
  async save(): Promise<string> {
    const logsDir = path.join(process.cwd(), "logs");

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const dateStr = this.startTime
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `${dateStr}_${this.mode}_${this.sessionId}.json`;
    const filepath = path.join(logsDir, filename);

    const logData: PipelineLogFile = {
      session: {
        id: this.sessionId,
        mode: this.mode,
        startedAt: this.startTime.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - this.startTime.getTime(),
      },
      pipeline: this.entries,
    };

    fs.writeFileSync(filepath, JSON.stringify(logData, null, 2), "utf-8");
    console.log(`[LOGGER] 📝 Log saved: ${filename}`);
    return filepath;
  }

  /** Generates a short random session ID */
  private createSessionId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}
