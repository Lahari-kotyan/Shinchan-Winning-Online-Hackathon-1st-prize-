/**
 * DARKSPOT — Decision Completeness Intelligence Platform
 * Domain Data Contracts & Intelligence Schema
 */

export type RequirementPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type GapStatus = 
  | 'SUPPORTED'
  | 'USER_ASSERTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONFLICTING'
  | 'OUTDATED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_FOUND';

export type RequirementStatus = GapStatus;

export type SourceType = 
  | 'OFFICIAL_DOCUMENT'
  | 'WEB_PAGE'
  | 'REGULATORY_FILING'
  | 'USER_UPLOAD'
  | 'PRIMARY_DISCLOSURE';

export interface DecisionRequirement {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  evidenceNeeded: string;
  priority: RequirementPriority;
  status: GapStatus;
  claimIds: string[];
  statusReason: string;
  unresolvedGaps: string[];
}

export interface EvidenceSource {
  id: string;
  title: string;
  url?: string;
  fileRef?: string;
  publisher: string;
  domain: string;
  publicationDate?: string;
  retrievalDate: string;
  sourceType: SourceType;
  extractedPassage: string;
  authorityScore: number; // 0-100 defensible rating
  freshnessScore: number; // 0-100 based on currency
  reliabilityNotes: string;
}

export interface ExtractedClaim {
  id: string;
  claimText: string;
  requirementId: string;
  sourceId: string;
  verbatimQuote: string;
  publicationDate?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  contradictsClaimIds?: string[];
  startOffset?: number;
  endOffset?: number;
  isVerbatim?: boolean;
  verificationStatus?: 'VERIFIED_IN_SOURCE' | 'UNVERIFIED_QUOTE';
}

export interface ContradictionFinding {
  id: string;
  requirementId: string;
  requirementTitle: string;
  type: 'DIRECT_CONTRADICTION' | 'DATE_DISCREPANCY' | 'NUMERICAL_MISMATCH' | 'SCOPE_MISMATCH';
  claimA: {
    claimId: string;
    sourceId: string;
    sourceTitle: string;
    statement: string;
    quote: string;
    date?: string;
  };
  claimB: {
    claimId: string;
    sourceId: string;
    sourceTitle: string;
    statement: string;
    quote: string;
    date?: string;
  };
  impactAnalysis: string;
  suggestedResolution: string;
  resolved?: boolean;
  resolutionNotes?: string;
  resolvedAt?: string;
  mathDelta?: string;
  isCodeVerified?: boolean;
}

export interface VerificationAction {
  id: string;
  requirementId: string;
  requirementTitle: string;
  whatNeedsVerification: string;
  whyItMatters: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  suggestedAuthority: string;
  concreteEvidenceRequired: string;
  completed: boolean;
}

export interface DecisionReadiness {
  status: 'DECISION_READY' | 'PROCEED_WITH_CAUTION' | 'NOT_READY';
  completenessScore: number; // Defensible % of weighted requirements satisfied
  summary: string;
  supportedAspects: string[];
  unresolvedRisks: string[];
  materialGaps: string[];
  preConditions: string[];
}

export type InvestigationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'COMPLETE'
  | 'FAILED';

export interface ActivityLogEntry {
  timestamp: string;
  stage: string;
  description: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  engine?: 'gemini' | 'heuristic' | 'failed';
}

export interface Investigation {
  id: string;
  decisionQuestion: string;
  context: string;
  createdAt: string;
  updatedAt: string;
  status: InvestigationStatus;
  progressStage?: string;
  requirements: DecisionRequirement[];
  sources: EvidenceSource[];
  claims: ExtractedClaim[];
  contradictions: ContradictionFinding[];
  verificationPlan: VerificationAction[];
  readiness: DecisionReadiness;
  isSample: boolean;
  errorMessage?: string;
  activityLog?: ActivityLogEntry[];
  engine?: 'gemini' | 'heuristic' | 'failed';
}

export interface InvestigationDocumentInput {
  title: string;
  content: string;
  publisher?: string;
  publicationDate?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileBase64?: string;
}

export interface NewInvestigationPayload {
  decisionQuestion: string;
  context?: string;
  sourceUrls?: string[];
  documents?: InvestigationDocumentInput[];
  rawNotes?: string;
  saveAsDraft?: boolean;
}
