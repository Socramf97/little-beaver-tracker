import {
  matchBabyName,
  maxDistance,
  STOPWORDS,
  takeOutPossessive,
} from "../matchBabyName";

// Helpers are tested on their own first, then matchBabyName is tested
// one case at a time, matching the case list at the top of matchBabyName.ts.

const BABIES = ["Emma", "Liam"];

/** matchBabyName takes words now: "emma had milk" -> ["emma", "had", "milk"] */
function toWords(text: string): string[] {
  return text.split(" ").filter(Boolean);
}

// HELPERS

describe("takeOutPossessive", () => {
  test.each([
    ["emma's", "emma"],
    ["liam's", "liam"],
    ["emma", "emma"], // nothing to remove
    ["'s", ""], // only the possessive
    ["is", "is"], // ends in "s" but not "'s"
  ])("%s -> %s", (input, expected) => {
    expect(takeOutPossessive(input)).toBe(expected);
  });
});

describe("maxDistance", () => {
  test.each([
    ["eva", 0], // 3 letters: exact only
    ["leo", 0],
    ["emma", 1], // 4–5 letters: 1 off
    ["chloe", 1],
    ["olivia", 2], // 6+ letters: 2 off
    ["isabella", 2],
  ])("%s -> %s", (name, expected) => {
    expect(maxDistance(name)).toBe(expected);
  });
});

describe("STOPWORDS", () => {
  test.each(["had", "milk", "the", "wet", "formula"])("includes %s", (word) => {
    expect(STOPWORDS.has(word)).toBe(true);
  });

  test("does not include names", () => {
    expect(STOPWORDS.has("emma")).toBe(false);
  });
});

// EACH CASE
describe("Case 1: exact match", () => {
  test.each([
    ["emma had milk", "Emma"],
    ["liam had a wet diaper", "Liam"],
    ["Emma had milk", "Emma"], // capitalized input
    ["i just fed emma", "Emma"], // name at the end
  ])("%s -> %s", (text, expected) => {
    expect(matchBabyName(toWords(text), BABIES)).toBe(expected);
  });

  test("returns the name as written in the profile", () => {
    expect(matchBabyName(toWords("emma had milk"), ["EMMA"])).toBe("EMMA");
  });

  test("first exact match wins when two names are said", () => {
    // Profile order decides. parseCommand only logs one baby per command.
    expect(matchBabyName(toWords("emma and liam had milk"), BABIES)).toBe(
      "Emma",
    );
  });
});

describe("Case 2: possessive", () => {
  test.each([
    ["emma's diaper was wet", "Emma"],
    ["liam's head is 14 inches", "Liam"],
  ])("%s -> %s", (text, expected) => {
    expect(matchBabyName(toWords(text), BABIES)).toBe(expected);
  });
});

describe("Case 3: two-word names", () => {
  const babies = ["Mary Kate", "Liam"];

  test("full name matches", () => {
    expect(matchBabyName(toWords("mary kate had milk"), babies)).toBe(
      "Mary Kate",
    );
  });

  test("half the name does not match", () => {
    // Two-word names are exact only, so "mary" alone isn't enough.
    expect(matchBabyName(toWords("mary had milk"), babies)).toBeUndefined();
  });
});

describe("Case 4: misheard (close spelling)", () => {
  test.each([
    ["ema had milk", ["Emma", "Liam"], "Emma"], // missing letter
    ["leam is wet", ["Emma", "Liam"], "Liam"], // wrong letter
    ["emmma had milk", ["Emma", "Liam"], "Emma"], // extra letter
    ["olivai had milk", ["Olivia", "Liam"], "Olivia"], // 2 off on a long name
    ["leam's diaper", ["Emma", "Liam"], "Liam"], // misheard + possessive
  ])("%s with %j -> %s", (text, babies, expected) => {
    expect(matchBabyName(toWords(text), babies)).toBe(expected);
  });

  test("exact match beats a close one", () => {
    // "ema" is 1 off "Emma", but it's an exact match for "Ema", so Ema wins.
    expect(matchBabyName(toWords("ema had milk"), ["Emma", "Ema"])).toBe("Ema");
  });

  test("closest name wins when two are close", () => {
    // "mattie" is 2 off "Maddie" and 1 off "Matti". Both are allowed, but Matti is closer,
    // even though Maddie comes first in the list.
    expect(matchBabyName(toWords("mattie had milk"), ["Maddie", "Matti"])).toBe(
      "Matti",
    );
  });

  test.each([
    ["ava had milk", ["Eva", "Liam"], "short name: 1 off is not enough"],
    [
      "liam had milk",
      ["Lia", "Emma"],
      "short name: extra letter is not enough",
    ],
    ["emmmmaa had milk", ["Emma", "Liam"], "too many letters off"],
  ])("no match: %s (%s)", (text, babies) => {
    expect(matchBabyName(toWords(text), babies)).toBeUndefined();
  });
});

describe("Case 5: no name", () => {
  test.each(["the baby had milk", "had three ounces of formula", ""])(
    "%j -> undefined",
    (text) => {
      expect(matchBabyName(toWords(text), BABIES)).toBeUndefined();
    },
  );

  test("no babies in the profile list", () => {
    expect(matchBabyName(toWords("emma had milk"), [])).toBeUndefined();
  });
});

describe("Stopwords and numbers never match a name", () => {
  test.each([
    ["had milk", ["Mila", "Liam"], "'milk' is 1 off 'mila'"],
    ["had a wet diaper", ["Hal", "Liam"], "'had' is 1 off 'hal'"],
    ["3 ounces", ["E3", "Liam"], "numbers are skipped"],
  ])("%s with %j (%s)", (text, babies) => {
    expect(matchBabyName(toWords(text), babies)).toBeUndefined();
  });
});

describe("Known limitation", () => {
  test("a different name 1 letter off still matches", () => {
    // "gemma" can't be told apart from a mishearing of "emma".
    // The confirmation ("Logged for Emma") + Undo is the safety net.
    expect(matchBabyName(toWords("gemma had milk"), BABIES)).toBe("Emma");
  });
});
