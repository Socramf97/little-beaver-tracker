import { parseCommands } from "../parseCommand";
import type { BabyRef } from "../types";

// Number conversion is tested in numberWords.test.ts,
// name matching in matchBabyName.test.ts.

const EMMA: BabyRef = { id: "b1", name: "Emma" };
const LIAM: BabyRef = { id: "b2", name: "Liam" };
const BABIES = [EMMA, LIAM];

describe("feeding", () => {
  test.each([
    {
      say: "Emma just had about three ounces of formula",
      expected: {
        kind: "feeding",
        baby: EMMA,
        feedType: "formula",
        amount: 3,
        unit: "oz",
        approximate: true,
      },
    },
    {
      say: "Liam drank 120 ml of breast milk",
      expected: {
        kind: "feeding",
        baby: LIAM,
        feedType: "bottle",
        amount: 120,
        unit: "ml",
        approximate: false,
      },
    },
    {
      say: "I nursed Liam",
      expected: {
        kind: "feeding",
        baby: LIAM,
        feedType: "breast",
        approximate: false,
      },
    },
    {
      say: "Ema had 4 ounces of milk", // misheard name
      expected: {
        kind: "feeding",
        baby: EMMA,
        feedType: "bottle",
        amount: 4,
        unit: "oz",
        approximate: false,
      },
    },
    {
      say: "Emma nursed for a long time", // "long" is a measurement word, but this is a feeding
      expected: {
        kind: "feeding",
        baby: EMMA,
        feedType: "breast",
        approximate: false,
      },
    },
  ])("$say", ({ say, expected }) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual(expected);
    expect(result.missing).toEqual([]);
  });
});

describe("diaper", () => {
  test.each([
    {
      say: "Liam had a wet diaper",
      expected: { kind: "diaper", baby: LIAM, pee: true, poop: false },
    },
    {
      say: "Emma's diaper was wet but no poop",
      expected: { kind: "diaper", baby: EMMA, pee: true, poop: false },
    },
    {
      say: "Liam peed and pooped",
      expected: { kind: "diaper", baby: LIAM, pee: true, poop: true },
    },
  ])("$say", ({ say, expected }) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual(expected);
    expect(result.missing).toEqual([]);
  });
});

describe("missing information", () => {
  test.each([
    {
      say: "had three ounces of formula",
      expected: {
        kind: "feeding",
        feedType: "formula",
        amount: 3,
        unit: "oz",
        approximate: false,
      },
      missing: ["babyName"],
    },
    {
      say: "Emma had some formula",
      expected: {
        kind: "feeding",
        baby: EMMA,
        feedType: "formula",
        approximate: false,
      },
      missing: ["amount"],
    },
    {
      say: "Emma had three ounces",
      expected: {
        kind: "feeding",
        baby: EMMA,
        amount: 3,
        unit: "oz",
        approximate: false,
      },
      missing: ["feedType"],
    },
    {
      say: "Changed Liam's diaper",
      expected: { kind: "diaper", baby: LIAM, pee: false, poop: false },
      missing: ["diaperContents"],
    },
  ])("$say -> missing $missing", ({ say, expected, missing }) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual(expected);
    expect(result.missing).toEqual(missing);
  });

  test("only one baby: the name isn't needed", () => {
    const result = parseCommands("had three ounces of formula", [EMMA]);
    expect(result.command).toMatchObject({ kind: "feeding", baby: EMMA });
    expect(result.missing).toEqual([]);
  });
});

describe("unknown", () => {
  test.each([
    "Emma weighs nine pounds four ounces",
    "What's the weather today",
    "",
  ])("%j -> unknown", (say) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual({ kind: "unknown" });
    expect(result.missing).toEqual([]);
  });
});

test("keeps the original transcript", () => {
  const say = "EMMA had 3 oz. of formula!";
  expect(parseCommands(say, BABIES).transcript).toBe(say);
});
