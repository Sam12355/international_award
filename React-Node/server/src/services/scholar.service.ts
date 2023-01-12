import { config } from '../config';
import logger from '../utils/logger';

interface ScholarResult {
  success: boolean;
  error?: string;
}

/**
 * Submit article metadata to Google Scholar for indexing.
 * Retries up to 3 times with exponential backoff.
 */
export async function submitToScholar(article: {
  id: number;
  title: string;
  abstract: string | null;
  keywords: string | null;
  doi: string | null;
  journal: { name: string; issn: string };
  user: { name: string };
}): Promise<ScholarResult> {
  const payload = {
    title: article.title,
    abstract: article.abstract,
    keywords: article.keywords?.split(',').map((k) => k.trim()) || [],
    authors: [article.user.name],
    journal: article.journal.name,
    issn: article.journal.issn,
    doi: article.doi,
    url: `${config.clientUrl}/articles/${article.id}`,
  };

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!config.scholar.apiUrl || !config.scholar.apiKey) {
        logger.warn('Scholar API credentials not configured — skipping indexing');
        return { success: false, error: 'Scholar API not configured' };
      }

      const response = await fetch(config.scholar.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.scholar.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logger.info(`Article submitted to Scholar`, { articleId: article.id });
        return { success: true };
      }

      const errorText = await response.text();
      logger.warn(`Scholar attempt ${attempt} failed: ${response.status}`, { errorText });
    } catch (error) {
      logger.error(`Scholar attempt ${attempt} error`, { error });
    }

    if (attempt < maxRetries) {
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }

  return { success: false, error: 'Scholar indexing failed after 3 attempts' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
