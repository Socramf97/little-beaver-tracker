// 1. Clean the string
// 2. Find the baby
// 3. parse either feeding, diaper, or measurement
import { BabyRef, CommandKind, ParsedCommand, ParsedResult } from "../types";
import { matchBabyName } from "./matchBabyName";
import { normalizeNumbers } from "./numberWords";
import { parseDiaper } from "./parseDiaper";
import { parseFeeding } from "./parseFeeding";
import { parseMeasurement } from "./parseMeasurements";

const FEEDING_WORDS = new Set([
  "fed",
  "feed",
  "feeding",
  "ate",
  "eat",
  "eaten",
  "drank",
  "drink",
  "bottle",
  "bottles",
  "formula",
  "milk",
  "breastmilk",
  "pumped",
  "nursed",
  "nursing",
  "nurse",
  "breastfed",
  "breastfeeding",
  "breast",
  "ounce",
  "ounces",
  "oz",
  "ml",
  "mls",
  "milliliter",
  "milliliters",
]);

const DIAPER_WORDS = new Set([
  "diaper",
  "diapers",
  "pee",
  "peed",
  "peeing",
  "wet",
  "urine",
  "poop",
  "pooped",
  "poopy",
  "pooping",
  "dirty",
  "bowel",
  "bm",
  "stool",
  "changed",
  "change",
]);

const APPROX_WORDS = new Set([
  "about",
  "around",
  "approximately",
  "roughly",
  "almost",
  "nearly",
  "maybe",
  "like",
]);

const MEASUREMENT_WORDS = new Set([
  "weigh",
  "weighs",
  "weighed",
  "weight",
  "pound",
  "pounds",
  "lb",
  "lbs",
  "kilo",
  "kilos",
  "kilogram",
  "kilograms",
  "kg",
  "gram",
  "grams",
  "length",
  "long",
  "tall",
  "height",
  "head",
  "circumference",
  "centimeter",
  "centimeters",
  "cm",
  "inch",
  "inches",
  "foot",
  "feet",
  "ft",
]);

// If any of these are said, it's NOT a measurement, even with a measurement word.
// "she nursed for a long time" has "long", but it's a feeding.
// Units like "ounces" are left out on purpose: "9 pounds 4 ounces" IS a measurement.
const NOT_MEASUREMENT_WORDS = new Set([
  ...DIAPER_WORDS,
  "fed",
  "feed",
  "feeding",
  "ate",
  "drank",
  "bottle",
  "formula",
  "milk",
  "nursed",
  "nursing",
  "breastfed",
  "breastfeeding",
]);
/** Main function entry */

export function parseCommands(text: string, babies: BabyRef[]): ParsedResult {
  const words = cleanWords(text);
  const cleaned_words = words.split(" ").filter(Boolean);

  const kind = findCommandKind(cleaned_words);

  if (kind === "unknown") {
    return { command: { kind: "unknown" }, transcript: text };
  }

  const baby = findBaby(cleaned_words, babies);

  if (kind === "diaper") {
    const details = parseDiaper(cleaned_words);

    const command: ParsedCommand = {
      kind: "diaper",
      baby,
      diaperType: details,
    };

    return { command, transcript: text };
  } else if (kind === "feeding") {
    const details = parseFeeding(cleaned_words);

    const command: ParsedCommand = {
      kind: "feeding",
      baby,
      ...details,
      approximate: cleaned_words.some((w) => APPROX_WORDS.has(w)),
    };
    return { command, transcript: text };
  } else if (kind === "measurement") {
    const details = parseMeasurement(cleaned_words);

    const command: ParsedCommand = {
      kind: "measurement",
      baby,
      ...details,
      approximate: cleaned_words.some((w) => APPROX_WORDS.has(w)),
    };
    return { command, transcript: text };
  }
  return { command: { kind: "unknown" }, transcript: text };
}

// HELPERS

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
  babies: BabyRef[],
): BabyRef | undefined {
  const names = babies.map((b) => b.name);
  const match = matchBabyName(words, names);
  if (match) return babies.find((b) => b.name === match);

  if (babies.length === 1) return babies[0];

  return undefined;
}

export function findCommandKind(words: string[]): CommandKind {
  const hasMeasurements = words.some((w) => MEASUREMENT_WORDS.has(w));
  const hasOther = words.some((w) => NOT_MEASUREMENT_WORDS.has(w));

  if (hasMeasurements && !hasOther) {
    return "measurement";
  }

  if (words.some((w) => DIAPER_WORDS.has(w))) {
    return "diaper";
  }

  if (words.some((w) => FEEDING_WORDS.has(w))) {
    return "feeding";
  }

  return "unknown";
}
