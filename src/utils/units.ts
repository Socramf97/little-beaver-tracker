// converting and displaying measurements.
// Storage is metric (kg, cm); display is what parents say.

import { MeasurementUnit } from "@/features/voice/types";

// HELPER
// ---------- To storage (used by toEventDraft) ----------
const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;
// translate to KG for measurement
export function toKg(
  amount: number,
  unit: MeasurementUnit,
): number | undefined {
  if (unit === "kg") {
    return amount;
  }

  if (unit === "lb") {
    return amount * KG_PER_LB;
  }

  if (unit === "g") {
    return amount / 1000;
  }

  return undefined;
}
// translate to CM for measurement
export function toCm(
  amount: number,
  unit: MeasurementUnit,
): number | undefined {
  if (unit === "cm") {
    return amount;
  }

  if (unit === "in") {
    return amount * CM_PER_INCH;
  }

  return undefined;
}

// ---------- For display (used by confirmationText, history screen) ----------

export function formatWeight(kg: number): string {
  const totalOunces = Math.round((kg / KG_PER_LB) * 16);
  const pounds = Math.floor(totalOunces / 16);
  const ounces = totalOunces % 16;

  const lbText = `${pounds} ${pounds === 1 ? "pound" : "pounds"}`;
  if (ounces === 0) return lbText;
  return `${lbText} ${ounces} ${ounces === 1 ? "ounce" : "ounces"}`;
}

export function formatLength(cm: number): string {
  const inches = Math.round((cm / CM_PER_INCH) * 10) / 10;
  return `${inches} ${inches === 1 ? "inch" : "inches"}`;
}
