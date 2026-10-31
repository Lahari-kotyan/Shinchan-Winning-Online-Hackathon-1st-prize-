/**
 * DARKSPOT — Deterministic Content-Derived Identifiers [C-05]
 * Replaces fragile index-based IDs (claim-1, act-1) with stable cryptographic hashes.
 * Ensures that incremental evidence ingestion preserves user interactions, checked action items,
 * and resolution notes across pipeline re-runs.
 */

import crypto from 'crypto';

/**
 * Generates a clean, short deterministic hex hash from arbitrary string input.
 */
export function deterministicHash(input: string, prefix = '', length = 12): string {
  const normalized = input.trim().replace(/\s+/g, ' ').toLowerCase();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, length);
  return prefix ? `${prefix}_${hash}` : hash;
}

/**
 * Stable Claim ID = hash(sourceId + normalizedQuote)
 */
export function computeClaimId(sourceId: string, quote: string): string {
  const normalized = (quote || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return deterministicHash(`${sourceId}::${normalized}`, 'clm', 10);
}

/**
 * Stable Conflict ID = hash(sortedClaimIds + conflictType)
 */
export function computeConflictId(claimIds: string[], conflictType: string): string {
  const sortedClaims = [...claimIds].map(s => s.trim().toLowerCase()).sort().join('::');
  return deterministicHash(`${sortedClaims}::${conflictType.trim().toUpperCase()}`, 'cnf', 10);
}

/**
 * Stable Verification Action ID = hash(requirementId + verificationActionText)
 */
export function computeActionId(requirementId: string, actionText: string): string {
  const normalizedAction = (actionText || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return deterministicHash(`${requirementId}::${normalizedAction}`, 'act', 10);
}
