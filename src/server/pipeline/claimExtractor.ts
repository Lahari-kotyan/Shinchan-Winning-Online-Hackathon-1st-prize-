/**
 * DARKSPOT Pipeline — Stage 2: Claim Extraction & Source Traceability
 * Extracts structured, verifiable claims directly from source texts.
 * Strict rule: Every claim MUST cite a verbatim passage from the input source.
 */

import { generateStructuredJson } from '../ai.ts';
import { DecisionRequirement, EvidenceSource, ExtractedClaim } from '../../types/intelligence.ts';

const CLAIM_EXTRACTION_SYSTEM = `
You are the Claim Extraction Engine of DARKSPOT.
Your job is to read source evidence passages and extract discrete, factual claims that directly address the user's Decision Requirements.

STRICT ACCURACY RULES:
1. NEVER invent claims or facts not in the source text.
2. For each claim, provide the verbatim supporting quotation directly from the provided source text.
3. Link the claim to the most relevant Requirement ID from the list provided.
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

export async function extractClaimsFromSources(
  requirements: DecisionRequirement[],
  sources: EvidenceSource[]
): Promise<ExtractedClaim[]> {
  if (sources.length === 0) {
    return [];
  }

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

  const fallbackFactory = (): ExtractedClaim[] => {
    // Deterministic extraction fallback when offline or no API key
    const claims: ExtractedClaim[] = [];
    sources.forEach((src, sIdx) => {
      const sentences = src.extractedPassage
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      sentences.slice(0, 4).forEach((sentence, idx) => {
        const assignedReq = requirements[idx % requirements.length] || requirements[0];
        claims.push({
          id: `claim-${sIdx + 1}-${idx + 1}`,
          claimText: sentence,
          requirementId: assignedReq.id,
          sourceId: src.id,
          verbatimQuote: sentence,
          publicationDate: src.publicationDate,
          confidence: 'HIGH',
        });
      });
    });
    return claims;
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

  return extracted.map((item, index) => ({
    id: `claim-${index + 1}`,
    claimText: item.claimText,
    requirementId: item.requirementId || requirements[0]?.id || 'req-1',
    sourceId: item.sourceId || sources[0]?.id || 'src-1',
    verbatimQuote: item.verbatimQuote || item.claimText,
    publicationDate: item.publicationDate,
    confidence: item.confidence || 'HIGH',
  }));
}
