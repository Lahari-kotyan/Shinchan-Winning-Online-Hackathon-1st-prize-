/**
 * DARKSPOT AI Intelligence Integration
 * Uses @google/genai SDK strictly on server-side with user-agent telemetry.
 */

import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export const PRIMARY_MODEL = 'gemini-3.8-flash';

/**
 * Utility to invoke Gemini with structured JSON output
 */
export async function generateStructuredJson<T>(
  systemInstruction: string,
  prompt: string,
  fallbackFactory: () => T
): Promise<T> {
  const ai = getGenAIClient();
  if (!ai) {
    console.warn('[DARKSPOT AI] GEMINI_API_KEY is not set. Executing deterministic heuristic pipeline.');
    return fallbackFactory();
  }

  try {
    const generatePromise = ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 10 seconds')), 10000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini model');
    }

    // Clean potential markdown wrap if any
    const cleanText = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error('[DARKSPOT AI] Gemini generation error, falling back:', error);
    return fallbackFactory();
  }
}
