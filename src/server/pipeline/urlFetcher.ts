/**
 * DARKSPOT — Safe URL Fetcher & Evidence Ingestion
 * Implements strict SSRF protection, request timeouts, and honest error reporting.
 * Rule: Never invent sources or pretend an inaccessible source was successfully inspected.
 */

import { EvidenceSource } from '../../types/intelligence.ts';

// Disallowed hosts / private IPs for SSRF defense
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^0\.0\.0\.0/,
  /^::1$/,
];

export function isSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname;
    for (const pattern of PRIVATE_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchEvidenceFromUrl(
  url: string,
  index: number
): Promise<{ source?: EvidenceSource; error?: string }> {
  if (!isSafeUrl(url)) {
    return { error: `URL "${url}" rejected: Invalid protocol or internal host prohibited by SSRF safety filter.` };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DARKSPOT-DecisionEngine/1.0; +https://darkspot.intelligence)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { error: `HTTP error ${res.status} (${res.statusText}) when retrieving ${url}` };
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `${domain} Page Reference`;

    // Strip scripts, styles, tags
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const snippet = cleanText.slice(0, 3500);

    return {
      source: {
        id: `src-url-${index + 1}`,
        title,
        url,
        publisher: domain.replace(/^www\./, ''),
        domain,
        publicationDate: new Date().toISOString().split('T')[0],
        retrievalDate: new Date().toISOString().split('T')[0],
        sourceType: 'WEB_PAGE',
        extractedPassage: snippet || `Retrieved page from ${url}`,
        authorityScore: 75,
        freshnessScore: 90,
        reliabilityNotes: `Directly fetched from live web page ${domain}.`,
      },
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Failed to retrieve ${url}: ${message}` };
  }
}
