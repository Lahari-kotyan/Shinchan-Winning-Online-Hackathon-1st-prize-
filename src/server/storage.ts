/**
 * DARKSPOT — Persistent Investigation Storage
 * Manages file-backed state in data/investigations.json.
 * Guarantees that refreshing or restarting preserves all ongoing investigations.
 */

import fs from 'fs';
import path from 'path';
import { Investigation } from '../types/intelligence.ts';
import { SAMPLE_INVESTIGATIONS } from './sampleData.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'investigations.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadInvestigations(): Investigation[] {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(DATA_FILE)) {
      saveInvestigations(SAMPLE_INVESTIGATIONS);
      return SAMPLE_INVESTIGATIONS;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveInvestigations(SAMPLE_INVESTIGATIONS);
      return SAMPLE_INVESTIGATIONS;
    }
    // Merge any missing sample datasets
    let modified = false;
    for (const sample of SAMPLE_INVESTIGATIONS) {
      if (!parsed.some((p: Investigation) => p.id === sample.id)) {
        parsed.push(sample);
        modified = true;
      }
    }
    if (modified) {
      saveInvestigations(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('[DARKSPOT Storage] Error loading investigations, restoring samples:', error);
    return SAMPLE_INVESTIGATIONS;
  }
}

export function saveInvestigations(investigations: Investigation[]): void {
  try {
    ensureDataDirectory();
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
