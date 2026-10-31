/**
 * DARKSPOT — Persistent Investigation Storage
 * Manages file-backed state in data/investigations.json.
 * Guarantees that refreshing or restarting preserves all ongoing investigations.
 * Dynamically computes completeness scores using calculateCompletenessScore.
 */

import fs from 'fs';
import path from 'path';
import { Investigation } from '../types/intelligence.ts';
import { SAMPLE_INVESTIGATIONS } from './sampleData.ts';
import { calculateCompletenessScore } from './pipeline/readinessAssessor.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'investigations.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Normalizes an investigation by ensuring dynamic completenessScore is accurate
 * and clearing stale PROCESSING status on restart.
 */
function normalizeInvestigation(inv: Investigation): boolean {
  let changed = false;

  // C-07: On server start, automatically convert stuck PROCESSING states to FAILED so users can retry
  if (inv.status === 'PROCESSING') {
    inv.status = 'FAILED';
    inv.errorMessage = 'Investigation pipeline was interrupted by a server restart. You may retry.';
    inv.progressStage = undefined;
    changed = true;
  }

  // C-09: Dynamically compute completenessScore using calculateCompletenessScore()
  if (inv.requirements && inv.requirements.length > 0 && inv.readiness) {
    const derivedScore = calculateCompletenessScore(inv.requirements);
    if (inv.readiness.completenessScore !== derivedScore) {
      inv.readiness.completenessScore = derivedScore;
      changed = true;
    }
  }

  return changed;
}

export function loadInvestigations(): Investigation[] {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(DATA_FILE)) {
      // Cold boot: Seed directly from sampleData with dynamic scores computed
      const cloned = JSON.parse(JSON.stringify(SAMPLE_INVESTIGATIONS)) as Investigation[];
      cloned.forEach(normalizeInvestigation);
      saveInvestigations(cloned);
      return cloned;
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const cloned = JSON.parse(JSON.stringify(SAMPLE_INVESTIGATIONS)) as Investigation[];
      cloned.forEach(normalizeInvestigation);
      saveInvestigations(cloned);
      return cloned;
    }

    let modified = false;

    // Check for stuck PROCESSING states and derived scores
    for (const inv of parsed) {
      if (normalizeInvestigation(inv)) {
        modified = true;
      }
    }

    // Merge any missing sample datasets
    for (const sample of SAMPLE_INVESTIGATIONS) {
      if (!parsed.some((p: Investigation) => p.id === sample.id)) {
        const sampleClone = JSON.parse(JSON.stringify(sample)) as Investigation;
        normalizeInvestigation(sampleClone);
        parsed.push(sampleClone);
        modified = true;
      }
    }

    if (modified) {
      saveInvestigations(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('[DARKSPOT Storage] Error loading investigations, restoring samples:', error);
    const cloned = JSON.parse(JSON.stringify(SAMPLE_INVESTIGATIONS)) as Investigation[];
    cloned.forEach(normalizeInvestigation);
    return cloned;
  }
}

export function saveInvestigations(investigations: Investigation[]): void {
  try {
    ensureDataDirectory();
    for (const inv of investigations) {
      if (inv.requirements && inv.requirements.length > 0 && inv.readiness) {
        inv.readiness.completenessScore = calculateCompletenessScore(inv.requirements);
      }
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(investigations, null, 2), 'utf-8');
  } catch (error) {
    console.error('[DARKSPOT Storage] Error saving investigations:', error);
  }
}

export function getInvestigationById(id: string): Investigation | null {
  const all = loadInvestigations();
  return all.find(i => i.id === id) || null;
}

export function upsertInvestigation(inv: Investigation): void {
  if (inv.requirements && inv.requirements.length > 0 && inv.readiness) {
    inv.readiness.completenessScore = calculateCompletenessScore(inv.requirements);
  }
  const all = loadInvestigations();
  const index = all.findIndex(i => i.id === inv.id);
  if (index >= 0) {
    all[index] = { ...inv, updatedAt: new Date().toISOString() };
  } else {
    all.unshift(inv);
  }
  saveInvestigations(all);
}

export function deleteInvestigationById(id: string): boolean {
  const all = loadInvestigations();
  const filtered = all.filter(i => i.id !== id);
  if (filtered.length !== all.length) {
    saveInvestigations(filtered);
    return true;
  }
  return false;
}
