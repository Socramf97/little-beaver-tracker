// Pulls out the feeding details

import type { FeedType, VolumeUnit } from "./types";

// Cases
// 1. Formula:           "emma had 3 ounces of formula"   -> formula, 3 oz
// 2. Bottle / milk:     "liam drank 120 ml of breast milk" -> bottle, 120 ml
// 3. Nursing:           "i nursed liam"                  -> breast, no amount
// 4. Amount, no type:   "emma had 3 ounces"              -> no type, 3 oz
// 5. Type, no amount:   "emma had some formula"          -> formula, no amount
// 6. Amount + nursing:  "breastfed 3 ounces"             -> bottle (you can't measure nursing)

const FORMULA_WORDS = new Set(["formula"]);
const BOTTLE_WORDS = new Set([
  "bottle",
  "bottles",
  "milk",
  "breastmilk",
  "pumped",
]);
const BREAST_WORDS = new Set([
  "nursed",
  "nursing",
  "nurse",
  "breastfed",
  "breastfeeding",
  "breast",
  "side",
]);

const OUNCE_WORDS = new Set(["ounce", "ounces", "oz"]);
const ML_WORDS = new Set(["ml", "mls", "milliliter", "milliliters", "cc"]);
const TIME_WORDS = new Set([
  "am",
  "pm",
  "minute",
  "minutes",
  "min",
  "mins",
  "hour",
  "hours",
  "o'clock",
  "oclock",
]);

export interface FeedingDetails {
  feedType?: FeedType;
  amount?: number;
  unit?: VolumeUnit;
}

/** Main Function entry point */

export function parseFeeding(text: string[]): FeedingDetails {
  let feedType = findFeedType(text);
  const { amount, unit } = findAmount(text);
  if (amount !== undefined && feedType === "breast") {
    feedType = "bottle";
  }
  return { feedType, amount, unit };
}

// HELPERS

export function findFeedType(text: string[]): FeedType | undefined {
  let feedType: FeedType | undefined;
  if (text.some((w) => FORMULA_WORDS.has(w))) {
    return "formula";
  }
  if (text.some((w) => BOTTLE_WORDS.has(w))) {
    return "bottle";
  }
  if (text.some((w) => BREAST_WORDS.has(w))) {
    return "breast";
  }

  return feedType;
}

export function findAmount(text: string[]): {
  amount?: number | undefined;
  unit?: VolumeUnit | undefined;
} {
  for (let i = 0; i < text.length; i++) {
    const word = text[i];

    const unit = toUnit(word);
    if (!unit) {
      continue;
    }

    let before = text[i - 1];
    if (before === "a" || before === "an") {
      before = text[i - 2];
    }

    if (isNumber(before)) {
      return { amount: Number(before), unit };
    }
  }
  for (let i = 0; i < text.length; i++) {
    const word = text[i];
    const next = text[i + 1];
    const before = text[i - 1];

    if (!isNumber(word)) continue;
    if (next !== undefined && TIME_WORDS.has(next)) continue; // 3 pm or 20 minutes
    if (before === "at") continue; // at 3
    return { amount: Number(word) };
  }

  return {};
}

function toUnit(word: string): VolumeUnit | undefined {
  let unit: VolumeUnit | undefined;
  if (OUNCE_WORDS.has(word)) {
    unit = "oz";
    return unit;
  }
  if (ML_WORDS.has(word)) {
    unit = "ml";
    return unit;
  }
  return unit;
}

function isNumber(word: string | undefined): boolean {
  return word !== undefined && /^\d+(\.\d+)?$/.test(word);
}
