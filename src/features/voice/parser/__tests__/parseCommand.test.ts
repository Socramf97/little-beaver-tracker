import type { BabyRef } from "../../types";
import { parseCommands } from "../parseCommand";

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
        unit: "mL",
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
  });
});

describe("diaper", () => {
  test.each([
    {
      say: "Liam had a wet diaper",
      expected: { kind: "diaper", baby: LIAM, diaperType: "pee" },
    },
    {
      say: "Emma's diaper was wet but no poop",
      expected: { kind: "diaper", baby: EMMA, diaperType: "pee" },
    },
    {
      say: "Liam peed and pooped",
      expected: { kind: "diaper", baby: LIAM, diaperType: "both" },
    },
  ])("$say", ({ say, expected }) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual(expected);
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
    },
    {
      say: "Emma had some formula",
      expected: {
        kind: "feeding",
        baby: EMMA,
        feedType: "formula",
        approximate: false,
      },
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
    },
    {
      say: "Changed Liam's diaper",
      expected: { kind: "diaper", baby: LIAM, diaperType: undefined },
    },
  ])("$say -> missing $missing", ({ say, expected }) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual(expected);
  });

  test("only one baby: the name isn't needed", () => {
    const result = parseCommands("had three ounces of formula", [EMMA]);
    expect(result.command).toMatchObject({ kind: "feeding", baby: EMMA });
  });
});

describe("unknown", () => {
  test.each(["What's the weather today", ""])("%j -> unknown", (say) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual({ kind: "unknown" });
  });
});

test("keeps the original transcript", () => {
  const say = "EMMA had 3 oz. of formula!";
  expect(parseCommands(say, BABIES).transcript).toBe(say);
});

describe("measurement", () => {
  test.each([
    {
      say: "Emma weighs nine pounds four ounces", // has "ounces", but must NOT be a feeding
      expected: {
        kind: "measurement",
        baby: EMMA,
        metric: "weight",
        value: 9.25,
        unit: "lb",
        approximate: false,
      },
    },
    {
      say: "Emma weighs 120 ounces", // ounces alone -> pounds
      expected: {
        kind: "measurement",
        baby: EMMA,
        metric: "weight",
        value: 7.5,
        unit: "lb",
        approximate: false,
      },
    },
    {
      say: "Liam weighs 4.2 kilograms",
      expected: {
        kind: "measurement",
        baby: LIAM,
        metric: "weight",
        value: 4.2,
        unit: "kg",
        approximate: false,
      },
    },
    {
      say: "Liam is 21 inches long",
      expected: {
        kind: "measurement",
        baby: LIAM,
        metric: "length",
        value: 21,
        unit: "in",
        approximate: false,
      },
    },
    {
      say: "Liam is one foot nine inches",
      expected: {
        kind: "measurement",
        baby: LIAM,
        metric: "length",
        value: 21,
        unit: "in",
        approximate: false,
      },
    },
    {
      say: "Liam's head is about 14 inches", // head beats length; "about" -> approximate
      expected: {
        kind: "measurement",
        baby: LIAM,
        metric: "head",
        value: 14,
        unit: "in",
        approximate: true,
      },
    },
    {
      say: "Emma is 9lb", // glued unit
      expected: {
        kind: "measurement",
        baby: EMMA,
        metric: "weight",
        value: 9,
        unit: "lb",
        approximate: false,
      },
    },
  ])("$say", ({ say, expected }) => {
    const result = parseCommands(say, BABIES);
    expect(result.command).toEqual(expected);
  });

  test("7 pounds and 3 ounces is exact (no rounding)", () => {
    const result = parseCommands("Emma weighs 7 pounds and 3 ounces", BABIES);
    expect(result.command).toMatchObject({
      kind: "measurement",
      metric: "weight",
      unit: "lb",
    });
    if (result.command.kind === "measurement") {
      expect(result.command.value).toBeCloseTo(7.1875, 4);
    }
  });

  test("no value said -> value is undefined", () => {
    const result = parseCommands("Log Emma's weight", BABIES);
    expect(result.command).toEqual({
      kind: "measurement",
      baby: EMMA,
      metric: "weight",
      approximate: false,
    });
  });
});
