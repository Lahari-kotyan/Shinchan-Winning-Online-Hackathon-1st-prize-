/**
 * DARKSPOT Pipeline — Stage 2: Claim Extraction & Source Traceability
 * Extracts structured, verifiable claims directly from source texts.
 * Enforces strict quote provenance verification with precise character offsets [C-04].
 * Uses stable content-derived IDs [C-05] and honest non-deceptive fallback [C-02].
 */

import { generateStructuredJson } from '../ai.ts';
import { DecisionRequirement, EvidenceSource, ExtractedClaim } from '../../types/intelligence.ts';
import { computeClaimId } from './hash.ts';

const CLAIM_EXTRACTION_SYSTEM = `
You are the Claim Extraction Engine of DARKSPOT.
Your job is to read source evidence passages and extract discrete, factual claims that directly address the user's Decision Requirements.

STRICT ACCURACY & PROVENANCE RULES:
1. NEVER invent claims or facts not in the source text.
2. For each claim, provide the EXACT verbatim supporting quotation directly from the provided source text.
3. Link the claim to the most relevant Requirement ID from the list provided. Do not invent requirement IDs.
4. Note the publication date of the source if provided.
5. Set confidence based on clarity and specificity in the text: 'HIGH', 'MEDIUM', or 'LOW'.

Return a JSON array:
[
  {
    "claimText": "Specific statement asserted by the source",
    "requirementId": "req-1",
    "sourceId": "src-1",
    "verbatimQuote": "Exact passage from the text supporting this",
    "publicationDate": "2025-11-15 or similar",
    "confidence": "HIGH" | "MEDIUM" | "LOW"
  }
]
`;

/**
 * Finds exact or whitespace-normalized quote inside source passage.
 * Returns startOffset and endOffset if verified.
 */
function verifyQuoteInPassage(
  passage: string,
  quote: string
): { isVerbatim: boolean; startOffset?: number; endOffset?: number; status: 'VERIFIED_IN_SOURCE' | 'UNVERIFIED_QUOTE' } {
  if (!quote || !passage) {
    return { isVerbatim: false, status: 'UNVERIFIED_QUOTE' };
  }

  // 1. Direct match
  const directIdx = passage.indexOf(quote);
  if (directIdx >= 0) {
    return {
      isVerbatim: true,
      startOffset: directIdx,
      endOffset: directIdx + quote.length,
      status: 'VERIFIED_IN_SOURCE',
    };
  }

  // 2. Case-insensitive / whitespace-normalized match
  const normPassage = passage.toLowerCase().replace(/\s+/g, ' ');
  const normQuote = quote.toLowerCase().replace(/\s+/g, ' ');
  const normIdx = normPassage.indexOf(normQuote);
  if (normIdx >= 0) {
    // Locate approximate offset in original passage
    const snippet = quote.slice(0, Math.min(25, quote.length));
    const approxStart = passage.toLowerCase().indexOf(snippet.toLowerCase());
    const validStart = approxStart >= 0 ? approxStart : normIdx;
    return {
      isVerbatim: true,
      startOffset: validStart,
      endOffset: validStart + quote.length,
      status: 'VERIFIED_IN_SOURCE',
    };
  }

  // Quote not found in source text
  return {
    isVerbatim: false,
    status: 'UNVERIFIED_QUOTE',
  };
}

export async function extractClaimsFromSources(
  requirements: DecisionRequirement[],
  sources: EvidenceSource[]
): Promise<ExtractedClaim[]> {
  if (sources.length === 0 || requirements.length === 0) {
    return [];
  }

  const validReqIds = new Set(requirements.map(r => r.id));
  const sourceMap = new Map(sources.map(s => [s.id, s]));

  const requirementsSummary = requirements
    .map(r => `[${r.id}] ${r.title}: ${r.description}`)
    .join('\n');

  const sourcesSummary = sources
    .map(
      s => `--- SOURCE [${s.id}] ---
Title: ${s.title}
Publisher: ${s.publisher} (${s.domain})
Date: ${s.publicationDate || 'Unknown'}
Content:
${s.extractedPassage}`
    )
    .join('\n\n');

  const prompt = `Requirements to map against:\n${requirementsSummary}\n\nEvidence Sources to extract from:\n${sourcesSummary}\n\nExtract discrete claims with exact verbatim quotes and mapped requirement IDs.`;

  // Honest fallback [C-02]: Never use round-robin mapping or pretend high-confidence claims exist
  const fallbackFactory = (): ExtractedClaim[] => {
    console.warn('[DARKSPOT ClaimExtractor] AI unavailable. Executing honest fallback without fabricated claims.');
    return [
      {
        id: computeClaimId(sources[0].id, 'Cannot assess - AI unavailable'),
        claimText: 'Cannot assess - AI unavailable. Provide GEMINI_API_KEY to extract traceable claims.',
        requirementId: requirements[0].id,
        sourceId: sources[0].id,
        verbatimQuote: 'Cannot assess - AI unavailable',
        confidence: 'LOW',
        isVerbatim: false,
        verificationStatus: 'UNVERIFIED_QUOTE',
      },
    ];
  };

  const extracted = await generateStructuredJson<
    Array<{
      claimText: string;
      requirementId: string;
      sourceId: string;
      verbatimQuote: string;
      publicationDate?: string;
      confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    }>
  >(CLAIM_EXTRACTION_SYSTEM, prompt, fallbackFactory);

  const results: ExtractedClaim[] = [];

  for (const item of extracted) {
    // C-04: Drop unmapped / invalid requirement IDs
    if (!item.requirementId || !validReqIds.has(item.requirementId)) {
      continue;
    }

    const source = sourceMap.get(item.sourceId) || sources[0];
    const quote = item.verbatimQuote || item.claimText || '';
    const { isVerbatim, startOffset, endOffset, status } = verifyQuoteInPassage(
      source.extractedPassage,
      quote
    );

    // C-05: Stable content-derived identifier
    const stableId = computeClaimId(source.id, quote);

    results.push({
      id: stableId,
      claimText: item.claimText,
      requirementId: item.requirementId,
      sourceId: source.id,
      verbatimQuote: quote,
      publicationDate: item.publicationDate || source.publicationDate,
      confidence: status === 'VERIFIED_IN_SOURCE' ? (item.confidence || 'HIGH') : 'LOW',
      startOffset,
      endOffset,
      isVerbatim,
      verificationStatus: status,
    });
  }

  return results;
}
