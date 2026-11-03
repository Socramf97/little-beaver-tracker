// Takes out diaper details such was was it pee, poop or both

import { DiaperType } from "@/features/events/types";

// Cases
// 1. pee
// 2. poop
// 3. both
// 4. negated (no poop)
// 5. Using numbers: number 1 , number 2
// 6. Neither -> Missing need to ask

const PEE_WORDS = new Set(["pee", "peed", "peeing", "wet", "urine", "pees"]);
const POOP_WORDS = new Set([
  "poop",
  "pooped",
  "poopy",
  "pooping",
  "poops",
  "dirty",
  "bowel",
  "bm",
  "stool",
  "messy",
]);
const BOTH_WORDS = new Set(["both"]);

const NEGATION_WORDS = new Set([
  "no",
  "not",
  "without",
  "didn't",
  "didnt",
  "never",
]);

/** Main function entry point */
export function parseDiaper(words: string[]): DiaperType | undefined {
  if (words.some((w) => BOTH_WORDS.has(w))) {
    return "both";
  }

  let pee = appears(words, PEE_WORDS);
  let poop = appears(words, POOP_WORDS);

  const numSaid = findNumbersAfterWord(words);
  if (numSaid.one) pee = true;
  if (numSaid.two) poop = true;
  if (pee && !poop) {
    return "pee";
  }

  if (!pee && poop) {
    return "poop";
  }

  if (pee && poop) return "both";

  return undefined;
}

// HELPERS

/** True of any words appear in the set and checks for negation */
export function appears(words: string[], wordSet: Set<string>): boolean {
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const before = words[i - 1];

    if (!wordSet.has(word)) {
      continue;
    }

    if (before !== undefined && NEGATION_WORDS.has(before)) {
      continue;
    }
    return true;
  }
  return false;
}

// "did a number 2" ->
export function findNumbersAfterWord(words: string[]): {
  one: boolean;
  two: boolean;
} {
  let one = false;
  let two = false;

  for (let i = 0; i < words.length; i++) {
    if (words[i] !== "number") {
      continue;
    }

    const next = words[i + 1];
    if (next === "1") one = true;
    if (next === "2") two = true;
  }
  return { one, two };
}
