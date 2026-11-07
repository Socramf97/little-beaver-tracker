// Takes out measurement details, which metric, and the value.
import type { MeasurementMetric, MeasurementUnit } from "../types";

// Cases
// 1. Weight, Pounds: "emma weighs 9 pounds" -> weight, 9 lb
// 2. Weight, lb + oz: "emma weighs 9 pounds 4 ounces" -> weight, 9.25 lb
// 3. Weight, metric: "liam weighs 4.2 kilograms" -> weight, 4.2 kg
// "liam weights 4000 grams"
// 4. Length, inches / cm: "emma is 21 inches long" -> length, 21 in
// 5. Length, feet + inches: "liam is 1 foot 9 inches" -> length, 21 in
// 6. Head: "liam's head is 14 inches" -> head, 14 in
// 8. No value: "log emma's weight" -> weight, no value = MISSING

const HEAD_WORDS = new Set(["head", "circumference"]);

const WEIGHT_WORDS = new Set(["weigh", "weighs", "weighed", "weight"]);
const POUND_WORDS = new Set(["pound", "pounds", "lb", "lbs"]);
const OUNCE_WORDS = new Set(["ounce", "ounces", "oz"]);
const KG_WORDS = new Set([
  "kilo",
  "kilos",
  "kilogram",
  "kilograms",
  "kg",
  "kgs",
]);
const GRAM_WORDS = new Set(["gram", "grams", "g"]);

const FOOT_WORDS = new Set(["foot", "feet", "ft"]);
const INCH_WORDS = new Set(["inch", "inches", "in"]);
const CM_WORDS = new Set(["centimeter", "centimeters", "cm", "cms"]);

export interface MeasurementDetails {
  metric: MeasurementMetric;
  value?: number;
  unit?: MeasurementUnit;
}

/** Main Function entry point */
export function parseMeasurement(words: string[]): MeasurementDetails {
  const measurementType = findType(words);

  if (measurementType === "weight") {
    return { metric: measurementType, ...findWeight(words) };
  }
  return { metric: measurementType, ...findLength(words) };
}

// HELPERS

function isNumber(word: string | undefined): boolean {
  return word !== undefined && /^\d+(\.\d+)?$/.test(word);
}

// Find the type of measurement we are measuring
export function findType(words: string[]): MeasurementMetric {
  if (words.some((w) => HEAD_WORDS.has(w))) return "head";

  const isWeight = words.some(
    (w) =>
      WEIGHT_WORDS.has(w) ||
      POUND_WORDS.has(w) ||
      OUNCE_WORDS.has(w) ||
      KG_WORDS.has(w) ||
      GRAM_WORDS.has(w),
  );
  if (isWeight) return "weight";

  return "length";
}

// Find the weight -> Units: g/kg/lb
// Cases:
// 1. 9 pounds and 4 ounces
// 2. 9 pounds 4 ounces
// 3. 9 pounds
// 4. 4 kg
export function findWeight(words: string[]): {
  value?: number;
  unit?: MeasurementUnit;
} {
  const pounds = findNumberBeforeUnit(words, POUND_WORDS);
  if (pounds) {
    const ounces = findNumberAfterUnit(words, pounds.unitIndex, OUNCE_WORDS);
    const total = pounds.value + (ounces ?? 0) / 16;
    return { value: total, unit: "lb" };
  }

  const ounces = findNumberBeforeUnit(words, OUNCE_WORDS);
  if (ounces) {
    return { value: ounces.value / 16, unit: "lb" };
  }
  const kg = findNumberBeforeUnit(words, KG_WORDS);
  if (kg) return { value: kg.value, unit: "kg" };

  const grams = findNumberBeforeUnit(words, GRAM_WORDS);
  if (grams) return { value: grams.value, unit: "g" };
  return {};
}

// Find the Length -> Units: ft/in/cm
// Cases:
// 1. 1 foot and 9 inches
// 2. 1 foot 4 inches
// 3. 1 foot
// 4. 35 cm

export function findLength(words: string[]): {
  value?: number;
  unit?: MeasurementUnit;
} {
  // length

  const feet = findNumberBeforeUnit(words, FOOT_WORDS);
  if (feet) {
    const inches = findNumberAfterUnit(words, feet.unitIndex, INCH_WORDS);
    const total = feet.value * 12 + (inches ?? 0);
    return { value: total, unit: "in" };
  }

  const inches = findNumberBeforeUnit(words, INCH_WORDS);
  if (inches) return { value: inches.value, unit: "in" };

  // head
  const cm = findNumberBeforeUnit(words, CM_WORDS);
  if (cm) return { value: cm.value, unit: "cm" };
  return {};
}

// Find a unit first then tracks backwards to find the value of that unit
export function findNumberBeforeUnit(
  words: string[],
  unitWords: Set<string>,
): { value: number; unitIndex: number } | undefined {
  for (let i = 0; i < words.length; i++) {
    if (!unitWords.has(words[i])) {
      continue;
    }

    const before = words[i - 1];
    if (isNumber(before)) {
      return { value: Number(before), unitIndex: i };
    }
  }
  return undefined;
}

// If there are two units inside such as 9 pounds AND 4 ounces OR 5 feet AND 2 inches
// Use the same structure as findBefore

export function findNumberAfterUnit(
  words: string[],
  unitIndex: number,
  unitWords: Set<string>,
): number | undefined {
  let j = unitIndex + 1;
  if (words[j] === "and") j += 1;

  const number = words[j];
  const unit = words[j + 1];

  if (isNumber(number) && unit !== undefined && unitWords.has(unit)) {
    return Number(number);
  }

  return undefined;
}
