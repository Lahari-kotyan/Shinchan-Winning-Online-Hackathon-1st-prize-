/**
 * DARKSPOT — Safe URL Fetcher & Evidence Ingestion
 * Implements enterprise-grade SSRF protection using Node.js net.BlockList,
 * asynchronous DNS IP resolution, redirect-loop validation, and timeout handling.
 * Rule: Never invent sources or pretend an inaccessible source was successfully inspected.
 */

import net from 'net';
import dns from 'dns/promises';
import { EvidenceSource } from '../../types/intelligence.ts';

// Configure net.BlockList with private, loopback, link-local, and cloud metadata ranges
const blockList = new net.BlockList();
blockList.addSubnet('127.0.0.0', 8, 'ipv4'); // Loopback
blockList.addSubnet('10.0.0.0', 8, 'ipv4'); // RFC 1918 Class A
blockList.addSubnet('172.16.0.0', 12, 'ipv4'); // RFC 1918 Class B
blockList.addSubnet('192.168.0.0', 16, 'ipv4'); // RFC 1918 Class C
blockList.addSubnet('169.254.0.0', 16, 'ipv4'); // Link-local & Cloud Metadata (169.254.169.254)
blockList.addSubnet('0.0.0.0', 8, 'ipv4'); // Current network
blockList.addSubnet('100.64.0.0', 10, 'ipv4'); // Shared address space
blockList.addAddress('::1', 'ipv6'); // IPv6 Loopback
blockList.addSubnet('fe80::', 10, 'ipv6'); // IPv6 Link-local
blockList.addSubnet('fc00::', 7, 'ipv6'); // IPv6 Unique Local

/**
 * Validates that an IP address or hostname does not resolve to a private/internal target.
 */
export async function isSafeUrl(rawUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Disallow trailing-dot hostnames (e.g. "localhost.")
    if (hostname.endsWith('.') || hostname.includes('..')) {
      return false;
    }

    // Direct string blacklists
    if (
      hostname === 'localhost' ||
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // If host is already an IP address
    const ipType = net.isIP(hostname);
    if (ipType !== 0) {
      const typeStr = ipType === 4 ? 'ipv4' : 'ipv6';
      return !blockList.check(hostname, typeStr);
    }

    // Resolve domain through DNS to check underlying IP addresses
    try {
      const lookupResults = await dns.lookup(hostname, { all: true });
      for (const res of lookupResults) {
        const typeStr = res.family === 4 ? 'ipv4' : 'ipv6';
        if (blockList.check(res.address, typeStr)) {
          return false;
        }
      }
    } catch {
      // DNS resolution failure means unreachable or suspicious host
      return false;
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
  const isSafe = await isSafeUrl(url);
  if (!isSafe) {
    return {
      error: `URL "${url}" rejected: Prohibited by strict SSRF safety policy (private, loopback, or cloud metadata target).`,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    let currentUrl = url;
    let redirectCount = 0;
    const maxRedirects = 3;
    let res: Response | null = null;

    // Follow redirects manually with SSRF validation on every jump
    while (redirectCount <= maxRedirects) {
      const safeStep = await isSafeUrl(currentUrl);
      if (!safeStep) {
        clearTimeout(timeoutId);
        return { error: `Redirect target "${currentUrl}" was rejected by SSRF filter.` };
      }

      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DARKSPOT-DecisionEngine/1.0; +https://darkspot.intelligence)',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
        },
      });

      // Handle 3xx redirects
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }

      break;
    }

    clearTimeout(timeoutId);

    if (!res || !res.ok) {
      const status = res ? res.status : 'Unknown';
      const statusText = res ? res.statusText : 'No response';
      return { error: `HTTP error ${status} (${statusText}) when retrieving ${url}` };
    }

    const html = await res.text();
    const parsed = new URL(currentUrl);
    const domain = parsed.hostname;

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
        url: currentUrl,
        publisher: domain.replace(/^www\./, ''),
        domain,
        publicationDate: new Date().toISOString().split('T')[0],
        retrievalDate: new Date().toISOString().split('T')[0],
        sourceType: 'WEB_PAGE',
        extractedPassage: snippet || `Retrieved page from ${currentUrl}`,
        authorityScore: 75,
        freshnessScore: 90,
        reliabilityNotes: `Directly fetched from live web page ${domain}.`,
      },
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('aborted')) {
      return { error: `Request timed out after 8 seconds while attempting to retrieve ${url}.` };
    }
    return { error: `Failed to retrieve evidence from ${url}: ${msg}` };
  }
}
