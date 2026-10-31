/**
 * DARKSPOT — Code-Computed Discrepancy Math [1-02]
 * Extracts and computes concrete chronological, financial, and percentage deltas
 * between conflicting claims without relying on LLM arithmetic hallucinations.
 */

interface MathDiscrepancyResult {
  deltaText: string;
  isVerified: boolean;
  category: 'CHRONOLOGICAL' | 'FINANCIAL' | 'PERCENTAGE' | 'MULTIPLE' | 'NONE';
}

/**
 * Extracts numeric value from a currency/financial token
 * Handles "$52,000", "$65k", "$9M", "$35M"
 */
function extractFinancialAmount(text: string): number | null {
  const match = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(k|m|million|thousand|billion)?/i);
  if (!match) return null;

  const rawNumber = parseFloat(match[1].replace(/,/g, ''));
  if (isNaN(rawNumber)) return null;

  const unit = (match[2] || '').toLowerCase();
  if (unit === 'k' || unit === 'thousand') return rawNumber * 1000;
  if (unit === 'm' || unit === 'million') return rawNumber * 1000000;
  if (unit === 'billion') return rawNumber * 1000000000;
  return rawNumber;
}

/**
 * Extracts percentage value like "15%", "20%"
 */
function extractPercentage(text: string): number | null {
  const match = text.match(/([\d]+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return isNaN(val) ? null : val;
}

/**
 * Extracts liquidation multiple like "1x", "2x"
 */
function extractMultiple(text: string): number | null {
  const match = text.match(/([\d]+(?:\.\d+)?)\s*x/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return isNaN(val) ? null : val;
}

/**
 * Attempts to parse date from string or date field
 */
function parseDateString(text: string): Date | null {
  // ISO date YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const d = new Date(isoMatch[0]);
    if (!isNaN(d.getTime())) return d;
  }

  // Month Day or Month Day, Year e.g. "October 31", "November 15, 2026"
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthRegex = new RegExp(`\\b(${months.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'i');
  const monthMatch = text.match(monthRegex);
  if (monthMatch) {
    const monthName = monthMatch[1];
    const day = parseInt(monthMatch[2], 10);
    const year = monthMatch[3] ? parseInt(monthMatch[3], 10) : 2026;
    const monthIdx = months.indexOf(monthName.toLowerCase());
    const d = new Date(year, monthIdx, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Computes concrete mathematical and chronological discrepancy between two statements/quotes.
 */
export function computeDiscrepancyMath(
  statementA: string,
  statementB: string,
  dateA?: string,
  dateB?: string
): MathDiscrepancyResult {
  const textA = `${statementA} ${dateA || ''}`;
  const textB = `${statementB} ${dateB || ''}`;

  // 1. Check Financial Delta
  const amountA = extractFinancialAmount(textA);
  const amountB = extractFinancialAmount(textB);
  if (amountA !== null && amountB !== null && amountA !== amountB) {
    const diff = Math.abs(amountA - amountB);
    const formattedDiff =
      diff >= 1000000
        ? `$${(diff / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`
        : `$${diff.toLocaleString('en-US')}`;
    return {
      deltaText: `${formattedDiff} variance between sources`,
      isVerified: true,
      category: 'FINANCIAL',
    };
  }

  // 2. Check Liquidation / Multiple Delta (e.g. 1x vs 2x)
  const multA = extractMultiple(textA);
  const multB = extractMultiple(textB);
  if (multA !== null && multB !== null && multA !== multB) {
    const diff = Math.abs(multA - multB);
    return {
      deltaText: `${diff}x multiple disparity (${multA}x vs ${multB}x)`,
      isVerified: true,
      category: 'MULTIPLE',
    };
  }

  // 3. Check Percentage Delta (e.g. 15% vs 20%)
  const pctA = extractPercentage(textA);
  const pctB = extractPercentage(textB);
  if (pctA !== null && pctB !== null && pctA !== pctB) {
    const diff = Math.abs(pctA - pctB);
    return {
      deltaText: `${diff}% equity dilution gap (${pctA}% vs ${pctB}%)`,
      isVerified: true,
      category: 'PERCENTAGE',
    };
  }

  // 4. Check Chronological Delta
  const parsedDateA = parseDateString(textA) || (dateA ? parseDateString(dateA) : null);
  const parsedDateB = parseDateString(textB) || (dateB ? parseDateString(dateB) : null);

  if (parsedDateA && parsedDateB) {
    const diffMs = Math.abs(parsedDateA.getTime() - parsedDateB.getTime());
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      const deltaText =
        diffDays >= 30
          ? `${Math.round(diffDays / 30)} month(s) (${diffDays} days) apart`
          : `${diffDays} days apart`;
      return {
        deltaText,
        isVerified: true,
        category: 'CHRONOLOGICAL',
      };
    }
  }

  return {
    deltaText: '',
    isVerified: false,
    category: 'NONE',
  };
}
