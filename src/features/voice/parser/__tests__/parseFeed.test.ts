import { normalizeNumbers } from "../numberWords";
import { findAmount, findFeedType, parseFeeding } from "../parseFeeding";

/** Same prep parseCommand does: lowercase, numbers to digits, split into words. */
function toWords(text: string): string[] {
  return normalizeNumbers(text.toLowerCase()).split(" ").filter(Boolean);
}

// ---------- Cases ----------

describe("Case 1: formula", () => {
  test.each([
    [
      "emma had three ounces of formula",
      { feedType: "formula", amount: 3, unit: "oz" },
    ],
    [
      "emma had twenty ml of formula",
      { feedType: "formula", amount: 20, unit: "ml" },
    ],
    ["120 cc of formula", { feedType: "formula", amount: 120, unit: "ml" }], // cc = ml
  ])("%s", (text, expected) => {
    expect(parseFeeding(toWords(text))).toEqual(expected);
  });
});

describe("Case 2: bottle / milk", () => {
  test.each([
    [
      "liam drank 120 ml of breast milk",
      { feedType: "bottle", amount: 120, unit: "ml" },
    ],
    ["emma had a 4 oz bottle", { feedType: "bottle", amount: 4, unit: "oz" }],
    ["emma had 4 ounce bottle", { feedType: "bottle", amount: 4, unit: "oz" }], // singular unit
    [
      "emma had 4 ounces of pumped milk",
      { feedType: "bottle", amount: 4, unit: "oz" },
    ],
    [
      "emma had 4 ounces of breastmilk",
      { feedType: "bottle", amount: 4, unit: "oz" },
    ], // one word
  ])("%s", (text, expected) => {
    expect(parseFeeding(toWords(text))).toEqual(expected);
  });
});

describe("Case 3: nursing", () => {
  test.each([
    "i nursed liam",
    "emma breastfed on the left side",
    "nursing on the right side",
    "emma nursed for a long time", // "a" must not become 1
    "nursed for 15 minutes", // a duration, not an amount
  ])("%s -> breast, no amount", (text) => {
    expect(parseFeeding(toWords(text))).toEqual({ feedType: "breast" });
  });
});

describe("Case 4: amount, no type", () => {
  test.each([
    ["emma had three ounces", { amount: 3, unit: "oz" }],
    ["emma had 120ml", { amount: 120, unit: "ml" }],
  ])("%s", (text, expected) => {
    expect(parseFeeding(toWords(text))).toEqual(expected);
  });
});

describe("Case 5: type, no amount", () => {
  test.each([
    ["emma had some formula", { feedType: "formula" }],
    ["emma had a bottle", { feedType: "bottle" }], // "a" must not become amount 1
  ])("%s", (text, expected) => {
    expect(parseFeeding(toWords(text))).toEqual(expected);
  });
});

describe("Case 6: amount + nursing word -> bottle", () => {
  // You can't measure ounces while nursing, so it must have been pumped milk.
  // If you removed this rule from parseFeeding on purpose, delete this test.
  test("emma breastfed 3 ounces", () => {
    expect(parseFeeding(toWords("emma breastfed 3 ounces"))).toEqual({
      feedType: "bottle",
      amount: 3,
      unit: "oz",
    });
  });
});

// ---------- Edge cases ----------

describe("which feed type wins", () => {
  test.each([
    ["formula and breast milk", "formula"], // formula is checked first
    ["breast milk in a bottle", "bottle"], // "milk" beats "breast"
    ["she nursed then had a bottle", "bottle"], // bottle beats nursing
  ])("%s -> %s", (text, expected) => {
    expect(parseFeeding(toWords(text)).feedType).toBe(expected);
  });
});

describe("amount formats", () => {
  test.each([
    ["emma had 2.5 ounces", 2.5], // decimal
    ["emma had 2.5oz", 2.5], // decimal, glued
    ["emma had 4oz of milk", 4], // glued
    ["emma had three and a half ounces", 3.5],
    ["emma had half an ounce", 0.5],
    ["emma had a half ounce", 0.5],
    ["emma had two point five ounces", 2.5],
    ["emma had one hundred twenty ml", 120],
  ])("%s -> %s", (text, expected) => {
    expect(parseFeeding(toWords(text)).amount).toBe(expected);
  });

  test("first amount wins when two are said", () => {
    expect(parseFeeding(toWords("3 ounces then 2 more ounces"))).toEqual({
      amount: 3,
      unit: "oz",
    });
  });
});

describe("number with no unit (pass 2)", () => {
  test("a bare number is the amount, with no unit", () => {
    expect(parseFeeding(toWords("emma had 3 of formula"))).toEqual({
      feedType: "formula",
      amount: 3,
    });
  });

  test.each([
    "fed at 3", // "at 3" is a time
    "fed at 3 pm",
    "emma had formula 2 hours ago",
    "emma had formula 20 minutes ago",
  ])("time, not an amount: %s", (text) => {
    expect(parseFeeding(toWords(text)).amount).toBeUndefined();
  });

  test("a unit with no number is not an amount", () => {
    expect(parseFeeding(toWords("how many ounces"))).toEqual({});
  });
});

test("empty input", () => {
  expect(parseFeeding([])).toEqual({});
});

// ---------- Helpers ----------

describe("findFeedType", () => {
  test.each([
    [["formula"], "formula"],
    [["bottle"], "bottle"],
    [["pumped"], "bottle"],
    [["nursed"], "breast"],
    [["juice"], undefined],
    [[], undefined],
  ])("%j -> %s", (words, expected) => {
    expect(findFeedType(words)).toBe(expected);
  });
});

describe("findAmount", () => {
  test.each([
    [["3", "ounces"], { amount: 3, unit: "oz" }],
    [["0.5", "an", "ounce"], { amount: 0.5, unit: "oz" }], // skips "an"
    [["0.5", "a", "ounce"], { amount: 0.5, unit: "oz" }], // skips "a"
    [["ounces"], {}], // unit, no number
    [["at", "3"], {}], // time
    [["3", "pm"], {}], // time
  ])("%j", (words, expected) => {
    expect(findAmount(words)).toEqual(expected);
  });
});

// ---------- Known limitations ----------
// These document what happens today. If you improve parseFeeding, update them.

describe("Known limitations", () => {
  test("a count of bottles is read as an amount", () => {
    // "two bottles" -> amount 2. Pass 2 takes any bare number.
    expect(parseFeeding(toWords("emma had two bottles"))).toEqual({
      feedType: "bottle",
      amount: 2,
    });
  });

  test("'2nd' is split into '2 nd' and read as an amount", () => {
    // prepare() splits a digit from letters ("4oz" -> "4 oz"), which also splits "2nd".
    expect(parseFeeding(toWords("emma's 2nd bottle")).amount).toBe(2);
  });

  test("a number with no unit has no unit (parseCommand must decide: default or ask)", () => {
    expect(parseFeeding(toWords("emma had 3 of formula")).unit).toBeUndefined();
  });
});
