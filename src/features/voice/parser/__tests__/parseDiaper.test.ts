import { appears, findNumbersAfterWord, parseDiaper } from "../parseDiaper";

// parseDiaper gets words that parseCommand already cleaned:
// lowercase, punctuation removed, "two" already turned into "2".
// toWords just splits, so the test sentences below are written that way.
function toWords(text: string): string[] {
  return text.split(" ").filter(Boolean);
}

const PEE = "pee";
const POOP = "poop";
const BOTH = "both";
const NEITHER = undefined;

// ---------- Cases ----------

describe("Case 1: pee", () => {
  test.each([
    "liam had a wet diaper",
    "emma peed",
    "she pees a lot",
    "urine only",
  ])("%s -> pee", (text) => {
    expect(parseDiaper(toWords(text))).toEqual(PEE);
  });
});

describe("Case 2: poop", () => {
  test.each([
    "emma pooped",
    "dirty diaper",
    "a poopy one",
    "messy diaper",
    "he had a bm",
    "stool was green",
  ])("%s -> poop", (text) => {
    expect(parseDiaper(toWords(text))).toEqual(POOP);
  });
});

describe("Case 3: both", () => {
  test.each([
    "liam's diaper had both", // the word "both"
    "wet and dirty", // each one said
    "liam peed and pooped",
    "pooped then peed", // order doesn't matter
    "both wet and dirty", // "both" plus each one
  ])("%s -> both", (text) => {
    expect(parseDiaper(toWords(text))).toEqual(BOTH);
  });
});

describe("Case 4: negated", () => {
  test.each([
    ["it was wet but no poop", PEE],
    ["no poop just wet", PEE], // negation before, real word after
    ["dirty not wet", POOP],
    ["she didn't pee", NEITHER],
    ["she didnt pee", NEITHER], // no apostrophe
    ["without poop", NEITHER],
    ["never pooped today", NEITHER],
  ])("%s", (text, expected) => {
    expect(parseDiaper(toWords(text))).toEqual(expected);
  });

  test("negation only cancels the word right after it", () => {
    // "no" cancels "wet", but "pee" later in the sentence still counts
    expect(parseDiaper(toWords("no wet spot but she did pee"))).toEqual(PEE);
  });
});

describe("Case 5: number 1 / number 2", () => {
  test.each([
    ["emma did a number 2", POOP],
    ["liam went number 1", PEE],
    ["number 1 and number 2", BOTH], // both said
    ["number 2 and number 1", BOTH], // either order
    ["wet and a number 2", BOTH], // mixed with a word
  ])("%s", (text, expected) => {
    expect(parseDiaper(toWords(text))).toEqual(expected);
  });

  test.each([
    "number 3", // not 1 or 2
    "her number", // "number" is the last word
    "number two", // still a word: parseCommand turns it into "2" before this runs
  ])("%s -> neither", (text) => {
    expect(parseDiaper(toWords(text))).toEqual(NEITHER);
  });
});

describe("Case 6: neither (parseCommand asks 'wet, dirty, or both?')", () => {
  test.each(["changed liam's diaper", "new diaper on", ""])(
    "%j -> neither",
    (text) => {
      expect(parseDiaper(toWords(text))).toEqual(NEITHER);
    },
  );
});

// ---------- Helpers ----------

describe("appears", () => {
  const SET = new Set(["wet"]);

  test.each([
    ["it was wet", true],
    ["not wet", false],
    ["wet", true], // first word: nothing before it
    ["dry", false],
    ["not wet but wet", true], // a later, un-negated mention counts
    ["", false],
  ])("%j -> %s", (text, expected) => {
    expect(appears(toWords(text), SET)).toBe(expected);
  });
});

describe("findNumbersAfterWord", () => {
  test.each([
    ["did a number 1", { one: true, two: false }],
    ["did a number 2", { one: false, two: true }],
    ["number 1 and number 2", { one: true, two: true }],
    ["number 5", { one: false, two: false }],
    ["number", { one: false, two: false }],
    ["1 2", { one: false, two: false }], // numbers without "number" before them
  ])("%j", (text, expected) => {
    expect(findNumbersAfterWord(toWords(text))).toEqual(expected);
  });
});

// ---------- Known limitations ----------
// These document what happens today. If you improve parseDiaper, update them.

describe("Known limitations", () => {
  test("negation only looks one word back", () => {
    // "wasn't any poop": "any" is before "poop", not a negation word
    expect(parseDiaper(toWords("there wasn't any poop"))).toEqual(POOP);
  });

  test("'no' only cancels the first word of a list", () => {
    // "no wet or dirty": "no" cancels "wet" only
    expect(parseDiaper(toWords("no wet or dirty"))).toEqual(POOP);
  });

  test("'both' always means both, even when negated", () => {
    expect(parseDiaper(toWords("not both just wet"))).toEqual(BOTH);
  });

  test("expects lowercase input (parseCommand lowercases first)", () => {
    expect(parseDiaper(toWords("WET diaper"))).toEqual(NEITHER);
  });
});
