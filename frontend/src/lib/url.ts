/**
 * url.ts — URL Content Extraction Module
 *
 * Fetches a webpage from a given URL, extracts readable text content
 * (title, body paragraphs, article content), and cleans it for
 * downstream analysis by the ChismiScan pipeline.
 *
 * Pipeline position: URL Input → Fetch → Extract → Clean → (same as text pipeline)
 */

import type { PipelineLogger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The structured output from URL content extraction */
export interface UrlExtractionResult {
  /** The page title extracted from <title> or <meta og:title> */
  title: string;
  /** The cleaned, readable text content of the page */
  content: string;
  /** The original URL that was fetched */
  sourceUrl: string;
  /** The domain of the source URL */
  domain: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum content length to send downstream (chars) */
const MAX_CONTENT_LENGTH = 5000;

/** Timeout for fetching a URL (ms) */
const FETCH_TIMEOUT_MS = 15000;

/** User-Agent to mimic a real browser for better HTML responses */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Fetches a URL, extracts readable text, and returns a cleaned result
 * ready for the ChismiScan analysis pipeline.
 *
 * @param url    - The URL to fetch and extract content from
 * @param logger - Optional pipeline logger to record extraction steps
 * @returns A structured UrlExtractionResult
 * @throws Error if the URL is invalid, unreachable, or has no extractable text
 */
export async function extractFromUrl(
  url: string,
  logger?: PipelineLogger
): Promise<UrlExtractionResult> {
  console.log(`[URL] 🌐 Starting URL content extraction: ${url}`);

  // ── Validate URL ──────────────────────────────────────────────────────
  const validatedUrl = validateUrl(url);
  const domain = extractDomain(validatedUrl);

  logger?.log("URL", "URL extraction started", {
    url: validatedUrl,
    domain,
  });

  // ── Fetch HTML ────────────────────────────────────────────────────────
  console.log("[URL] ⬇️ Fetching webpage HTML...");
  const html = await fetchHtml(validatedUrl);
  console.log(`[URL] 📄 Fetched ${html.length} chars of HTML`);

  logger?.log("URL", "HTML fetched successfully", {
    htmlLength: html.length,
  });

  // ── Extract title ─────────────────────────────────────────────────────
  const title = extractTitle(html);
  console.log(`[URL] 📰 Extracted title: "${title}"`);

  // ── Extract and clean body text ───────────────────────────────────────
  console.log("[URL] 🧹 Extracting and cleaning body text...");
  const rawText = extractBodyText(html);
  const content = cleanExtractedText(rawText);

  if (!content || content.length < 20) {
    throw new Error(
      "Could not extract readable text from this URL. The page may be behind a paywall, require JavaScript, or have no article content."
    );
  }

  // Truncate to max length to avoid overloading downstream
  const truncatedContent =
    content.length > MAX_CONTENT_LENGTH
      ? content.substring(0, MAX_CONTENT_LENGTH) + "..."
      : content;

  console.log(`[URL] ✅ Extracted ${truncatedContent.length} chars of clean text`);
  console.log(`[URL] 📄 Content preview: "${truncatedContent.substring(0, 100)}..."`);

  logger?.log("URL", "Content extracted and cleaned", {
    title,
    domain,
    rawTextLength: rawText.length,
    cleanedTextLength: truncatedContent.length,
    contentPreview: truncatedContent.substring(0, 200),
  });

  return {
    title,
    content: truncatedContent,
    sourceUrl: validatedUrl,
    domain,
  };
}

// ─── URL Validation ──────────────────────────────────────────────────────────

/**
 * Validates and normalizes a URL string.
 * Prepends "https://" if no protocol is specified.
 *
 * @throws Error if the URL is not a valid HTTP/HTTPS URL
 */
function validateUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "https://" + normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Only HTTP and HTTPS URLs are supported.");
    }
    return parsed.toString();
  } catch {
    throw new Error(
      "Invalid URL. Please provide a valid web address (e.g., https://example.com/article)."
    );
  }
}

/**
 * Extracts the domain from a URL string.
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ─── HTML Fetching ───────────────────────────────────────────────────────────

/**
 * Fetches the HTML content of a URL with timeout and error handling.
 *
 * @throws Error if the fetch fails, times out, or returns a non-OK status
 */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fil;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL (HTTP ${response.status}). The page may be unavailable or blocking requests.`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      throw new Error(
        `URL does not point to an HTML page (content-type: ${contentType}). Please provide a link to a news article or web page.`
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "URL fetch timed out. The page may be slow or unreachable."
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── HTML Parsing (Zero-Dependency) ──────────────────────────────────────────

/**
 * Extracts the page title from HTML.
 * Checks <title>, <meta og:title>, and <h1> in priority order.
 */
function extractTitle(html: string): string {
  // Try <meta property="og:title">
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogTitleMatch?.[1]) return decodeHtmlEntities(ogTitleMatch[1].trim());

  // Try <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) return decodeHtmlEntities(titleMatch[1].trim());

  // Try first <h1>
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) return decodeHtmlEntities(stripHtmlTags(h1Match[1]).trim());

  return "Untitled Page";
}

/**
 * Extracts the main readable body text from HTML.
 * Prioritizes <article>, <main>, and content-like containers.
 * Falls back to full <body> if no semantic containers are found.
 */
function extractBodyText(html: string): string {
  // Remove non-content elements first
  let cleaned = html;

  // Remove <script>, <style>, <noscript>, <nav>, <footer>, <header>, <aside>, <iframe>
  cleaned = cleaned.replace(
    /<(script|style|noscript|nav|footer|header|aside|iframe|svg|form|menu)[^>]*>[\s\S]*?<\/\1>/gi,
    " "
  );

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, " ");

  // Try to extract from semantic article containers first
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch?.[1]) {
    const text = stripHtmlTags(articleMatch[1]);
    if (text.length > 100) return text;
  }

  // Try <main>
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch?.[1]) {
    const text = stripHtmlTags(mainMatch[1]);
    if (text.length > 100) return text;
  }

  // Try common content class/id patterns
  const contentPatterns = [
    /<div[^>]+(?:class|id)=["'][^"']*(?:article|content|post|entry|story|body-text|main-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      const text = stripHtmlTags(match[1]);
      if (text.length > 100) return text;
    }
  }

  // Fallback: extract from <body>
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1]) {
    return stripHtmlTags(bodyMatch[1]);
  }

  // Last resort: strip everything
  return stripHtmlTags(cleaned);
}

/**
 * Strips all HTML tags from a string, preserving text content.
 * Adds spaces between block-level elements for readability.
 */
function stripHtmlTags(html: string): string {
  return (
    html
      // Add newlines before/after block elements
      .replace(/<\/?(?:p|div|br|h[1-6]|li|tr|blockquote|section)[^>]*>/gi, "\n")
      // Remove all remaining tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&mdash;/gi, "—")
      .replace(/&ndash;/gi, "–")
      .replace(/&hellip;/gi, "…")
      .replace(/&#\d+;/gi, " ")
      .replace(/&\w+;/gi, " ")
  );
}

/**
 * Decodes common HTML entities in a string.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ");
}

// ─── Text Cleaning ───────────────────────────────────────────────────────────

/**
 * Cleans extracted text from HTML.
 * Removes excessive whitespace, duplicate lines, navigation remnants, etc.
 */
function cleanExtractedText(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      // Collapse excessive blank lines
      .replace(/\n{3,}/g, "\n\n")
      // Collapse multiple spaces/tabs
      .replace(/[ \t]+/g, " ")
      // Trim each line
      .replace(/^\s+|\s+$/gm, "")
      // Remove very short lines (likely navigation/UI elements)
      .split("\n")
      .filter((line) => line.length > 2)
      .join("\n")
      .trim()
  );
}
