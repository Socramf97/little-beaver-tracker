import { normalizeNumbers } from "../numberWords";
import {
  findLength,
  findType,
  findWeight,
  parseMeasurement,
} from "../parseMeasurements";

// Lowercase, numbers to digits, split into words.
function toWords(text: string): string[] {
  return normalizeNumbers(text.toLowerCase()).split(" ").filter(Boolean);
}

// ---------- Cases ----------

describe("Case 1: weight in pounds", () => {
  test.each([
    ["emma weighs 9 pounds", 9],
    ["emma weighs nine pounds", 9],
    ["emma weighs nine and a half pounds", 9.5],
    ["emma weighs 9 lbs", 9],
    ["emma is 9 lb", 9],
  ])("%s -> %s lb", (text, value) => {
    expect(parseMeasurement(toWords(text))).toEqual({
      metric: "weight",
      value,
      unit: "lb",
    });
  });
});

describe("Case 2: pounds + ounces", () => {
  test.each([
    ["emma weighs nine pounds four ounces", 9.25],
    ["emma weighs 7 pounds and 3 ounces", 7.1875],
    ["emma is 8 lbs 8 oz", 8.5],
    ["emma weighs 6 pounds 0 ounces", 6],
  ])("%s -> %s lb", (text, value) => {
    const result = parseMeasurement(toWords(text));
    expect(result.metric).toBe("weight");
    expect(result.unit).toBe("lb");
    expect(result.value).toBeCloseTo(value, 4);
  });
});

describe("Case 2b: ounces alone (converted to pounds)", () => {
  test.each([
    ["emma weighs 120 ounces", 7.5],
    ["emma weighs 8 oz", 0.5],
  ])("%s -> %s lb", (text, value) => {
    expect(parseMeasurement(toWords(text))).toEqual({
      metric: "weight",
      value,
      unit: "lb",
    });
  });
});

describe("Case 3: metric weight", () => {
  test.each([
    ["liam weighs 4.2 kilograms", 4.2, "kg"],
    ["liam weighs three point two kilos", 3.2, "kg"],
    ["liam is 4 kg", 4, "kg"],
    ["liam weighs 3500 grams", 3500, "g"],
    ["liam weighs three thousand five hundred grams", 3500, "g"],
  ])("%s -> %s %s", (text, value, unit) => {
    expect(parseMeasurement(toWords(text))).toEqual({
      metric: "weight",
      value,
      unit,
    });
  });
});

describe("Case 4: length in inches / cm", () => {
  test.each([
    ["emma is twenty one inches long", 21, "in"],
    ["emma is twenty one and a half inches long", 21.5, "in"],
    ["liam is 53 centimeters", 53, "cm"],
    ["liam is 53 cm long", 53, "cm"],
  ])("%s -> %s %s", (text, value, unit) => {
    expect(parseMeasurement(toWords(text))).toEqual({
      metric: "length",
      value,
      unit,
    });
  });
});

describe("Case 5: feet + inches", () => {
  test.each([
    ["liam is one foot nine inches", 21],
    ["liam is 1 foot and 9 inches", 21],
    ["emma is two feet long", 24],
    ["emma is 2 ft 1 in", 25],
  ])("%s -> %s in", (text, value) => {
    expect(parseMeasurement(toWords(text))).toEqual({
      metric: "length",
      value,
      unit: "in",
    });
  });
});

describe("Case 6: head", () => {
  test.each([
    ["liam's head is 14 inches", 14, "in"],
    ["emma's head circumference is thirty five cm", 35, "cm"],
    ["head is 13.5 inches", 13.5, "in"],
  ])("%s -> %s %s", (text, value, unit) => {
    expect(parseMeasurement(toWords(text))).toEqual({
      metric: "head",
      value,
      unit,
    });
  });
});

describe("Case 7: no value (parseCommand asks)", () => {
  test.each([
    ["log emma's weight", "weight"],
    ["measure liam's head", "head"],
    ["how long is emma", "length"],
    ["emma weighs about a pound", "weight"], // "a" is not a number
  ])("%s -> %s, no value", (text, metric) => {
    expect(parseMeasurement(toWords(text))).toEqual({ metric });
  });
});

// ---------- Edge cases ----------

describe("which metric wins", () => {
  test.each([
    ["head is 14 inches", "head"], // head beats the length unit
    ["head weighs 1 pound", "head"], // head beats weight (odd, but head comes first)
    ["weighs 9 pounds", "weight"],
    ["is 21 inches", "length"],
    ["is tall", "length"], // default
  ])("%s -> %s", (text, metric) => {
    expect(findType(toWords(text))).toBe(metric);
  });
});

test("first number + unit wins when two are said", () => {
  expect(parseMeasurement(toWords("emma was 8 pounds now 9 pounds"))).toEqual({
    metric: "weight",
    value: 8,
    unit: "lb",
  });
});

test("a random number after pounds is ignored", () => {
  // "and 4" with no unit after it: only the pounds count
  expect(parseMeasurement(toWords("emma weighs 9 pounds and 4"))).toEqual({
    metric: "weight",
    value: 9,
    unit: "lb",
  });
});

// ---------- Helpers ----------

describe("findWeight", () => {
  test.each([
    [["9", "pounds"], { value: 9, unit: "lb" }],
    [["9", "pounds", "4", "ounces"], { value: 9.25, unit: "lb" }],
    [["120", "ounces"], { value: 7.5, unit: "lb" }], // ounces alone
    [["9", "pounds", "and", "4", "ounces"], { value: 9.25, unit: "lb" }],
    [["9", "pounds", "4"], { value: 9, unit: "lb" }], // "4" with no unit is ignored
    [["4", "kg"], { value: 4, unit: "kg" }],
    [["pounds"], {}], // unit, no number
    [[], {}],
  ])("%j", (words, expected) => {
    expect(findWeight(words)).toEqual(expected);
  });
});

describe("findLength", () => {
  test.each([
    [["21", "inches"], { value: 21, unit: "in" }],
    [["1", "foot", "9", "inches"], { value: 21, unit: "in" }],
    [["2", "feet"], { value: 24, unit: "in" }],
    [["53", "cm"], { value: 53, unit: "cm" }],
    [["inches"], {}],
    [[], {}],
  ])("%j", (words, expected) => {
    expect(findLength(words)).toEqual(expected);
  });
});
