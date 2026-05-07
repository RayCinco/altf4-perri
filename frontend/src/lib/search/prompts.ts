/**
 * Prompt formatters for AI analysis and search stages.
 */

export function formatSearchContextPrompt(searchContext: string): string {
  return `\n\nAdditional search context for fact-checking:\n${searchContext}`;
}

export function formatUserPrompt(text: string): string {
  return `Analyze the following text and classify it:\n\n---\n${text}\n---`;
}
