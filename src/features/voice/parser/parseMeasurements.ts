// Takes out measurement details, which metric, and the value.
import type { MeasurementMetric, MeasurementUnit } from "./types";

// Cases
// 1. Weight, Pounds: "emma weighs 9 pounds" -> weight, 9 lb
// 2. Weight, lb + oz: "emma weighs 9 pounds 4 ounces" -> weight, 9.25 lb
// 3. Weight, metric: "liam weighs 4.2 kilograms" -> weight, 4.2 kg
// "liam weights 4000 grams / gs"
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
