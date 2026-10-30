import { distance } from "fastest-levenshtein";

// Converting a name into a real baby name

// Cases
// 1. Exact Match EX: Emma had milk -> Emma
// 2. Possessive: Emma's Diaper -> Emma
// 3. Two word names: Mary Kate had milk -> Mary Kate
// 4. Misheard (Close Spelling) -> ema had milk -> Emma
// 5. No Name -> Missing Name

// Common words that are close to short names but should never match one.
export const STOPWORDS = new Set([
  "had",
  "has",
  "the",
  "and",
  "just",
  "about",
  "ounce",
  "ounces",
  "milk",
  "with",
  "she",
  "he",
  "his",
  "her",
  "was",
  "is",
  "a",
  "an",
  "of",
  "for",
  "baby",
  "diaper",
  "wet",
  "dirty",
  "poop",
  "pee",
  "both",
  "bottle",
  "formula",
  "breast",
  "weighs",
  "weight",
  "inches",
  "pounds",
  "head",
  "long",
  "fed",
  "ate",
  "drank",
]);
/**
 * Main Function entry
 */

export function matchBabyName(
  words: string[],
  babyNames: string[],
): string | undefined {
  const names = babyNames.map((n) => ({ original: n, lower: n.toLowerCase() }));
  const cleanedWords = words.map(takeOutPossessive);

  const joinedWord = " " + cleanedWords.join(" ") + " ";

  // This handles if we find the name INSIDE the word we separate it. with spaces
  // Case 1 & 2: Handles exact and possessive
  for (const name of names) {
    if (joinedWord.includes(" " + name.lower + " ")) {
      return name.original;
    }
  }

  // Fuzzy matches
  let bestMatch: string | undefined = undefined;
  let bestDistance = Infinity;

  for (const word of cleanedWords) {
    if (STOPWORDS.has(word) || /^\d/.test(word)) continue;

    for (const name of names) {
      const lowerName = name.lower;
      if (lowerName.includes(" ")) {
        continue;
      }
      const d = distance(word, lowerName);

      if (d <= maxDistance(lowerName) && d < bestDistance) {
        bestDistance = d;
        bestMatch = name.original;
      }
    }
  }

  return bestMatch;
}

export function takeOutPossessive(word: string): string {
  return word.endsWith("'s") ? word.slice(0, -2) : word;
}

/** Short names need a tighter match, or every 3-letter word becomes a baby. */
export function maxDistance(name: string): number {
  if (name.length <= 3) return 0;
  if (name.length <= 5) return 1;
  return 2;
}
