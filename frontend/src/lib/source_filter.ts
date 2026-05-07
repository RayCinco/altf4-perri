/**
 * source_filter.ts — Source Credibility Filter
 *
 * Classifies search results into trusted, semi-trusted, or untrusted
 * based on domain reputation. Produces a credibility score (0–100)
 * that the AI pipeline uses to weight evidence quality.
 *
 * This module does NOT make truth judgments — it only evaluates
 * whether a source is generally reliable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single raw search result from SerperDev */
export interface SearchSource {
    title: string;
    snippet: string;
    link: string;
}

/** A search result after credibility classification */
export interface CategorizedSource {
    title: string;
    snippet: string;
    link: string;
    domain: string;
    credibility: "trusted" | "semi-trusted" | "untrusted";
}

/** The output of the source filtering step */
export interface FilteredSources {
    /** All sources with credibility tags */
    sources: CategorizedSource[];
    /** Credibility score (0–100) based on source quality distribution */
    credibilityScore: number;
    /** Count breakdowns */
    trustedCount: number;
    semiTrustedCount: number;
    untrustedCount: number;
    /** Formatted context string for Gemini (only trusted + semi-trusted) */
    formattedContext: string;
}

// ─── Domain Lists ─────────────────────────────────────────────────────────────

/**
 * Trusted domains — established news organizations, government sites,
 * recognized institutions, and verified fact-checking outlets.
 */
const TRUSTED_DOMAINS: string[] = [
    // International News
    "bbc.com", "bbc.co.uk",
    "cnn.com",
    "reuters.com",
    "apnews.com",
    "aljazeera.com",
    "theguardian.com",
    "nytimes.com",
    "washingtonpost.com",
    "bloomberg.com",
    "forbes.com",
    "time.com",
    "economist.com",
    "france24.com",

    // Philippine News
    "rappler.com",
    "inquirer.net",
    "abs-cbn.com",
    "gmanetwork.com",
    "philstar.com",
    "mb.com.ph",
    "manilatimes.net",
    "sunstar.com.ph",
    "pna.gov.ph",
    "cnnphilippines.com",

    // Government
    "gov.ph",
    "gov.uk",
    "gov.au",
    "whitehouse.gov",
    "congress.gov",
    "senate.gov.ph",

    // International Organizations
    "who.int",
    "un.org",
    "unicef.org",
    "worldbank.org",

    // Science & Research
    "nature.com",
    "nasa.gov",
    "nih.gov",
    "cdc.gov",
    "sciencedirect.com",
    "pubmed.ncbi.nlm.nih.gov",

    // Sports (official)
    "espn.com",
    "nba.com",
    "fifa.com",
    "olympics.com",

    // Fact-Checkers
    "snopes.com",
    "factcheck.org",
    "politifact.com",
    "verafiles.org",
    "checkyourfact.com",

    // Tech (official / established)
    "techcrunch.com",
    "wired.com",
    "arstechnica.com",
    "theverge.com",
];

/**
 * Semi-trusted domain patterns — informational sites with
 * some authority but not primary reporting outlets.
 */
const SEMI_TRUSTED_PATTERNS: string[] = [
    "wikipedia.org",
    "medium.com",
    "substack.com",
    "yahoo.com",
    "msn.com",
    "huffpost.com",
    "buzzfeed.com",
    "vice.com",
    "businessinsider.com",
    "insider.com",
    "newsweek.com",
    "usatoday.com",
    "dailymail.co.uk",
    "youtube.com", // Official channels can be credible but mixed
];

/**
 * Semi-trusted TLD patterns — educational/organizational domains
 * that generally carry more authority than commercial sites.
 */
const SEMI_TRUSTED_TLDS: string[] = [".edu", ".ac.", ".org"];

/**
 * Untrusted / blocked domain patterns — social media, personal blogs,
 * forums, and known clickbait domains.
 */
const UNTRUSTED_PATTERNS: string[] = [
    // Social Media
    "facebook.com",
    "fb.com",
    "instagram.com",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "threads.net",

    // Forums & Community
    "reddit.com",
    "quora.com",
    "4chan.org",
    "tumblr.com",

    // Personal Blog Platforms
    "blogspot.com",
    "blogspot.co",
    "wordpress.com",
    "wix.com",
    "weebly.com",
    "sites.google.com",
    "notion.site",

    // Clickbait / Tabloid
    "theonion.com",
    "babylonbee.com",
    "worldnewsdailyreport.com",
    "empirenews.net",
    "huzlers.com",
    "newsbreakapp.com",

    // Content Farms
    "scribd.com",
    "slideshare.net",
];

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Extracts the domain from a URL string.
 *
 * @param url - Full URL (e.g., "https://www.espn.com/nba/recap/...")
 * @returns Domain string (e.g., "espn.com")
 */
function extractDomain(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        // Remove "www." prefix for cleaner matching
        return hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

/**
 * Classifies a single source domain into a credibility tier.
 *
 * Priority: untrusted → trusted → semi-trusted → default untrusted
 *
 * @param domain - The extracted domain to classify
 * @returns The credibility tier
 */
function classifyDomain(domain: string): CategorizedSource["credibility"] {
    const lowerDomain = domain.toLowerCase();

    // Check untrusted first (block known bad sources)
    if (UNTRUSTED_PATTERNS.some((p) => lowerDomain.includes(p))) {
        return "untrusted";
    }

    // Check trusted domains
    if (TRUSTED_DOMAINS.some((d) => lowerDomain.includes(d))) {
        return "trusted";
    }

    // Check semi-trusted specific domains
    if (SEMI_TRUSTED_PATTERNS.some((p) => lowerDomain.includes(p))) {
        return "semi-trusted";
    }

    // Check semi-trusted TLDs (.edu, .org, .ac.)
    if (SEMI_TRUSTED_TLDS.some((tld) => lowerDomain.includes(tld))) {
        return "semi-trusted";
    }

    // Unknown domains default to untrusted
    return "untrusted";
}

/**
 * Calculates an overall credibility score (0–100) based on the
 * distribution and quality of classified sources.
 *
 * Weighting: trusted = 1.0, semi-trusted = 0.4, untrusted = 0.0
 * The score is the weighted average normalized to 100.
 */
function calculateCredibilityScore(sources: CategorizedSource[]): number {
    if (sources.length === 0) return 0;

    const weights = { trusted: 1.0, "semi-trusted": 0.4, untrusted: 0.0 };
    const totalWeight = sources.reduce(
        (sum, s) => sum + weights[s.credibility],
        0
    );
    const maxWeight = sources.length * 1.0;

    return Math.round((totalWeight / maxWeight) * 100);
}

/**
 * Formats only trusted and semi-trusted sources into a context
 * string suitable for Gemini's user prompt. Untrusted sources
 * are excluded from the AI's reasoning context.
 */
function formatCredibleContext(sources: CategorizedSource[]): string {
    const credible = sources.filter((s) => s.credibility !== "untrusted");
    const untrusted = sources.filter((s) => s.credibility === "untrusted");

    if (credible.length === 0) {
        // Tell Gemini exactly what was (and wasn't) found
        const socialMediaDomains = [
            "facebook.com", "fb.com", "instagram.com", "tiktok.com",
            "twitter.com", "x.com", "threads.net",
        ];
        const socialMedia = untrusted.filter((s) =>
            socialMediaDomains.some((sm) => s.domain.includes(sm))
        );

        let msg = "NO CREDIBLE SEARCH RESULTS FOUND FOR THIS CLAIM.";
        if (socialMedia.length > 0) {
            msg += ` NOTE: ${socialMedia.length} social media source(s) were found but excluded as they are NOT credible evidence (domains: ${socialMedia.map((s) => s.domain).join(", ")}). Social media alone cannot confirm a claim as TRUE.`;
        } else if (untrusted.length > 0) {
            msg += ` NOTE: ${untrusted.length} untrusted source(s) were found and excluded from this context.`;
        }
        return msg;
    }

    return credible
        .map((source, index) => {
            const tag =
                source.credibility === "trusted" ? "[TRUSTED]" : "[SEMI-TRUSTED]";
            return `Source ${index + 1} ${tag}:\nTitle: ${source.title}\nSnippet: ${source.snippet}\nLink: ${source.link}\nDomain: ${source.domain}\n`;
        })
        .join("\n");
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Filters and classifies an array of raw search results by
 * source credibility. Returns structured, categorized output
 * with a credibility score and formatted context for Gemini.
 *
 * @param rawResults - Array of raw search result objects from SerperDev
 * @returns FilteredSources with categorized sources and credibility score
 */
export function filterSources(
    rawResults: SearchSource[],
): FilteredSources {
    const sources: CategorizedSource[] = rawResults.map((result) => {
        const domain = extractDomain(result.link);
        const credibility = classifyDomain(domain);

        return {
            title: result.title,
            snippet: result.snippet,
            link: result.link,
            domain,
            credibility,
        };
    });

    const trustedCount = sources.filter((s) => s.credibility === "trusted").length;
    const semiTrustedCount = sources.filter((s) => s.credibility === "semi-trusted").length;
    const untrustedCount = sources.filter((s) => s.credibility === "untrusted").length;
    const credibilityScore = calculateCredibilityScore(sources);
    const formattedContext = formatCredibleContext(sources);

    const result: FilteredSources = {
        sources,
        credibilityScore,
        trustedCount,
        semiTrustedCount,
        untrustedCount,
        formattedContext,
    };


    console.log(
        `[FILTER] 🏷️ Source credibility: ${trustedCount} trusted, ${semiTrustedCount} semi-trusted, ${untrustedCount} untrusted (score: ${credibilityScore}/100)`
    );

    return result;
}