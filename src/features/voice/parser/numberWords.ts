// Converting a spoken number into a real number so we only need to deal with one format

// Cases
// 1. Single number word -> "three ounces" -> 3 ounces -> wordsToNumbers
// 2. Tens + ones -> "twenty five ml" -> 25 ml -> wordsToNumbers
// 3. Hundreds -> "one hundred twenty ml" -> 120 ml -> wordsToNumbers
// 4. Decimal -> "two point five ounces" -> "2.5 ounces" -> wordsToNumbers
// 5. Number + fraction -> "Three and a half ounces", "4 1/2 oz" -> 3.5 ounces, 4.5 oz
// 6. Fraction alone -> "half an ounce" -> 0.5 ounce
import { wordsToNumbers } from "words-to-numbers";

/**
 * Main Function Entry
 */

export function normalizeNumbers(text: string): string {
  let s = prepare(text);
  s = String(wordsToNumbers(s));

  s = addFractionsToNumber(s); // "3 and a half", "4½" -> "3.5", "4.5"
  s = fractionOnItsOwn(s); // "half an ounce" -> "0.5 an ounce"
  return s;
}

export function prepare(text: string): string {
  return text
    .toLowerCase() // 1
    .replace(/(\d)([½¼¾⅓⅔])/g, "$1 $2") // 2
    .replace(/(\d)([a-z])/g, "$1 $2") // 3
    .replace(/-/g, " ") // 4
    .replace(/[,!?]/g, "") // 5
    .replace(/\.(?!\d)/g, "") // 6
    .replace(/\s+/g, " ") // 7
    .trim(); // 8
}

export function isWholeNumber(word: string | undefined): boolean {
  return word !== undefined && /^\d+$/.test(word);
}

/**
 * Case 5: A fraction right after a number gets added to it
 * EX: 3 and a half -> 3.5, "3 and a quarter" -> "3.25"
 * EX: "4 1/2" -> "4.5"
 */

const FRACTIONS: Record<string, number> = {
  half: 0.5,
  quarter: 0.25,
  "1/2": 0.5,
  "½": 0.5,
  "1/4": 0.25,
  "¼": 0.25,
};

// Returns the fraction's value, or undefined if the word isn't a fraction
function getFraction(word: string | undefined): number | undefined {
  if (word === undefined || !Object.hasOwn(FRACTIONS, word)) return undefined;
  return FRACTIONS[word];
}

export function addFractionsToNumber(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  let i = 0;

  while (i < words.length) {
    const currentWord = words[i];
    const nextWord = words[i + 1];

    // 3 and a half OR 3 and half OR 3 and 1 half
    if (isWholeNumber(currentWord) && nextWord === "and") {
      let j = i + 2; // the word after "and"

      if (words[j] === "a" || words[j] === "1") {
        j += 1;
      } // skip the optional "a OR 1"
      const fraction = getFraction(words[j]);
      if (fraction !== undefined) {
        results.push(String(Number(currentWord) + fraction));
        i = j + 1; // jump after fraction word
        continue;
      }
    }

    // "4 1/2 "
    const fraction = getFraction(nextWord);
    const isSymbol = nextWord !== undefined && /[\/½¼¾]/.test(nextWord);

    if (isWholeNumber(currentWord) && isSymbol && fraction !== undefined) {
      results.push(String(Number(currentWord) + fraction));
      i += 2;
      continue;
    }

    // regular word
    results.push(currentWord);
    i += 1;
  }
  return results.join(" ");
}

/**
 * Case 6: Fraction on its own, no nnumber before it
 * EX: half an ounce -> 0.5 ounce
 * # quarter ounce -> 0.25 ounce
 */

export function fractionOnItsOwn(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  let i = 0;

  while (i < words.length) {
    const currentWord = words[i];
    const value = getFraction(currentWord);

    // "half and half" is the cream, not a number
    if (
      currentWord === "half" &&
      words[i + 1] === "and" &&
      words[i + 2] === "half"
    ) {
      results.push("half and half");
      i += 3;
      continue;
    }

    // regular word
    if (value === undefined) {
      results.push(currentWord);
      i += 1;
      continue;
    }

    // "a half" -> remove the "a" we already added
    const lastWord = results[results.length - 1];
    if (lastWord === "a" || lastWord === "an" || lastWord === "1") {
      results.pop();
    }

    results.push(String(value));
    i += 1;

    // "half an ounce" -> skip the "an"
    if (words[i] === "a" || words[i] === "an") {
      i += 1;
    }
  }

  return results.join(" ");
}
