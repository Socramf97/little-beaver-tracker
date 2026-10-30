// 1. Clean the string
// 2. Find the baby
// 3. parse either feeding, diaper, or measurement
import { matchBabyName } from "./matchBabyName.ts";
import { normalizeNumbers } from "./numberWords.ts";

export function cleanWords(words: string): string {
  const cleaned = words
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/-/g, " ") // "twenty-five" -> "twenty five"
    .replace(/[^a-z0-9.'½¼/\s]/g, " ") // drop punctuation, keep decimals and fractions
    .replace(/\.(?!\d)/g, " ") // a period not followed by a digit is sentence punctuation
    .replace(/\s+/g, " ")
    .trim();
  return normalizeNumbers(cleaned);
}

export function findBaby(
  words: string[],
  babyNames: string[],
): { babyName?: string; missing: boolean } {
  const match = matchBabyName(words, babyNames);
  if (match) return { babyName: match, missing: false };

  if (babyNames.length === 1) return { babyName: babyNames[0], missing: false };

  return { babyName: undefined, missing: true };
}
