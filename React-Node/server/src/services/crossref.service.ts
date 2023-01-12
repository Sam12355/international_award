import { config } from '../config';
import logger from '../utils/logger';

interface CrossRefResult {
  success: boolean;
  doi?: string;
  error?: string;
}

/**
 * Register a DOI with CrossRef via XML deposit.
 * Retries up to 3 times with exponential backoff.
 */
export async function registerDoi(article: {
  id: number;
  title: string;
  abstract: string | null;
  journal: { name: string; issn: string };
  user: { name: string };
}): Promise<CrossRefResult> {
  const doi = `10.47281/${article.journal.issn}.${article.id}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch version="4.4.2" xmlns="http://www.crossref.org/schema/4.4.2">
  <head>
    <doi_batch_id>sjp-${article.id}-${timestamp}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>SJP Platform</depositor_name>
      <email_address>noreply@sjp.dev</email_address>
    </depositor>
    <registrant>Scientific Journal Platform</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata>
        <full_title>${escapeXml(article.journal.name)}</full_title>
        <issn>${article.journal.issn}</issn>
      </journal_metadata>
      <journal_article>
        <titles>
          <title>${escapeXml(article.title)}</title>
        </titles>
        <contributors>
          <person_name sequence="first" contributor_role="author">
            <given_name>${escapeXml(article.user.name.split(' ')[0] || '')}</given_name>
            <surname>${escapeXml(article.user.name.split(' ').slice(1).join(' ') || article.user.name)}</surname>
          </person_name>
        </contributors>
        <doi_data>
          <doi>${doi}</doi>
          <resource>${config.clientUrl}/articles/${article.id}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`;

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!config.crossref.depositUrl || !config.crossref.username) {
        logger.warn('CrossRef credentials not configured — skipping DOI registration');
        return { success: false, doi, error: 'CrossRef not configured' };
      }

      const credentials = Buffer.from(
        `${config.crossref.username}:${config.crossref.password}`,
      ).toString('base64');

      const response = await fetch(config.crossref.depositUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          Authorization: `Basic ${credentials}`,
        },
        body: xml,
      });

      if (response.ok) {
        logger.info(`DOI registered: ${doi}`, { articleId: article.id });
        return { success: true, doi };
      }

      const errorText = await response.text();
      logger.warn(`CrossRef attempt ${attempt} failed: ${response.status}`, { errorText });
    } catch (error) {
      logger.error(`CrossRef attempt ${attempt} error`, { error });
    }

    if (attempt < maxRetries) {
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }

  return { success: false, doi, error: 'DOI registration failed after 3 attempts' };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
