/**
 * Generate a deterministic reference code for an article.
 * Format: SJP-{journalId padded to 2}-{articleId padded to 5}
 * Example: SJP-01-00001
 */
export function makeReference(journalId: number, articleId: number): string {
  const journalPart = String(journalId).padStart(2, '0');
  const articlePart = String(articleId).padStart(5, '0');
  return `SJP-${journalPart}-${articlePart}`;
}
