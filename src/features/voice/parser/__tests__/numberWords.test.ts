import {
  normalizeNumbers,
  wordsToDigits,
  joinTensAndOnes,
  joinHundreds,
  joinDecimals,
  addFractionsToNumber,
  fractionOnItsOwn,
  isWholeNumber,
} from "../numberWords";

// Each helper is tested on its own first, using the input it would actually
// receive (after the earlier helpers have run). Then normalizeNumbers is tested
// end to end with real sentences.

describe("isWholeNumber", () => {
  test.each([
    ["5", true],
    ["25", true],
    ["2.5", false],
    ["1/2", false],
    ["emma", false],
    ["", false],
  ])("%s -> %s", (input, expected) => {
    expect(isWholeNumber(input)).toBe(expected);
  });

  test("undefined (past the end of the word list) -> false", () => {
    expect(isWholeNumber(undefined)).toBe(false);
  });
});

describe("Case 1: wordsToDigits", () => {
  test.each([
    ["three ounces", "3 ounces"],
    ["twenty five ml", "20 5 ml"], // joined later by joinTensAndOnes
    ["one hundred", "1 hundred"], // "hundred" is handled by joinHundreds
    ["emma had milk", "emma had milk"], // non-number words untouched
    ["3 ounces", "3 ounces"], // digits pass through
  ])("%s -> %s", (input, expected) => {
    expect(wordsToDigits(input)).toBe(expected);
  });
});

describe("Case 2: joinTensAndOnes", () => {
  test.each([
    ["20 5 ml", "25 ml"],
    ["90 9", "99"],
    ["20 ml", "20 ml"], // tens alone
    ["5 20", "5 20"], // wrong order: ones then tens
    ["20 1/2", "20 1/2"], // "1/2" is a fraction, not a ones digit
    ["20", "20"], // last word: next is undefined
  ])("%s -> %s", (input, expected) => {
    expect(joinTensAndOnes(input)).toBe(expected);
  });
});

describe("Case 3: joinHundreds", () => {
  test.each([
    ["2 hundred ml", "200 ml"],
    ["1 hundred 20 ml", "120 ml"],
    ["1 hundred and 5 ml", "105 ml"],
    ["1 hundred and 25 ml", "125 ml"],
    ["hundred ml", "hundred ml"], // no number before
    ["1 hundred and emma", "100 and emma"], // "and" not followed by a number
  ])("%s -> %s", (input, expected) => {
    expect(joinHundreds(input)).toBe(expected);
  });
});

describe("Case 4: joinDecimals", () => {
  test.each([
    ["2 point 5 ounces", "2.5 ounces"],
    ["emma had 2 point 5 ounces", "emma had 2.5 ounces"], // no duplicate "2", unit kept
    ["point 5 ounces", "0.5 ounces"], // no number before -> 0
    ["at this point emma", "at this point emma"], // "point" not followed by a number
  ])("%s -> %s", (input, expected) => {
    expect(joinDecimals(input)).toBe(expected);
  });
});

describe("Case 5: addFractionsToNumber", () => {
  test.each([
    ["3 and a half ounces", "3.5 ounces"],
    ["4 and half oz", "4.5 oz"], // no "a"
    ["3 and a quarter ounces", "3.25 ounces"],
    ["4 1/2 oz", "4.5 oz"],
    ["4 ½ oz", "4.5 oz"],
    ["4½ oz", "4.5 oz"], // glued
    ["20 1/2 oz", "20.5 oz"],
    ["3 and 4", "3 and 4"], // "and" not followed by a fraction
    ["half an ounce", "half an ounce"], // no number before: left for case 6
  ])("%s -> %s", (input, expected) => {
    expect(addFractionsToNumber(input)).toBe(expected);
  });
});

describe("Case 6: fractionOnItsOwn", () => {
  test.each([
    ["half an ounce", "0.5 an ounce"],
    ["a half ounce", "0.5 ounce"], // "a" dropped
    ["a quarter ounce", "0.25 ounce"],
    ["½ oz", "0.5 oz"],
    ["1/2 oz", "0.5 oz"],
    ["emma had a bottle", "emma had a bottle"], // "a" kept when no fraction follows
  ])("%s -> %s", (input, expected) => {
    expect(fractionOnItsOwn(input)).toBe(expected);
  });
});

describe("normalizeNumbers (all steps together)", () => {
  test.each([
    ["emma had three ounces of formula", "emma had 3 ounces of formula"],
    ["emma had three and a half ounces", "emma had 3.5 ounces"],
    ["liam had twenty five ml", "liam had 25 ml"],
    ["one hundred twenty ml", "120 ml"],
    ["one hundred and twenty five ml", "125 ml"],
    ["two point five ounces", "2.5 ounces"],
    ["half an ounce", "0.5 an ounce"],
    ["emma weighs nine pounds four ounces", "emma weighs 9 pounds 4 ounces"],
    ["no numbers here", "no numbers here"],
    ["", ""],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeNumbers(input)).toBe(expected);
  });

  // Recognizers sometimes mix digits and words in one sentence.
  test.each([
    ["3 and a half ounces", "3.5 ounces"],
    ["twenty 5 ml", "25 ml"],
    ["four point 5 ounces", "4.5 ounces"],
    ["1 hundred and twenty five ml", "125 ml"],
    ["one hundred 20 ml", "120 ml"],
    ["two 1/2 ounces", "2.5 ounces"],
    ["twenty 1/2 ounces", "20.5 ounces"],
    ["nine pounds 4 ounces", "9 pounds 4 ounces"],
  ])("mixed: %s -> %s", (input, expected) => {
    expect(normalizeNumbers(input)).toBe(expected);
  });
});
