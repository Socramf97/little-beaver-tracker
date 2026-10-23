// Converting a spoken number into a real number so we only need to deal with one format
// EX: "Three and a half ounces" -> "3.5 ounces"
// EX: "twenty five ml" -> "25 ml"
// EX: "4 1/2oz" -> "4.5 oz"
// EX: "half an ounce" -> "0.5 ounce"

// Cases
// 1. Single number word -> "three ounces" -> 3 ounces
// 2. Tens + ones -> "twenty five ml" -> 25 ml
// 3. Hundreds -> "one hundred twenty ml" -> 120 ml
// 4. Decimal -> "two point five ounces" -> "2.5 ounces"
// 5. Number + fraction -> "Three and a half ounces", "4 1/2 oz" -> 3.5 ounces, 4.5 oz
// 6. Fraction alone -> "half an ounce" -> 0.5 ounce

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/**
 * Main Function Entry
 */

export function normalizeNumbers(text: string): string {
  let string = text;
  string = wordsToDigits(string); // "twenty five" -> "20 5"
  string = joinTensAndOnes(string); // "20 5" -> "25"
  string = joinHundreds(string); // "1 hundred 20" -> "120"
  string = joinDecimals(string); // "2 point 5" -> "2.5"
  string = addFractionsToNumber(string); // "3 and a half", "4½" -> "3.5", "4.5"
  string = fractionOnItsOwn(string); // "half an ounce" -> "0.5 an ounce"
  return string;
}

/**
 * Case 1: Every number becomes a digit
 */

export function wordsToDigits(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  for (const word of words) {
    if (word in NUMBER_WORDS) {
      results.push(String(NUMBER_WORDS[word]));
    } else {
      results.push(word);
    }
  }
  return results.join(" ");
}

/**
 * Case 2: Join tens and ones
 * If there is a ten that follows a one, it must be combined
 */

const TENS = ["20", "30", "40", "50", "60", "70", "80", "90"];
const ONES = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function joinTensAndOnes(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  let i = 0;

  while (i < words.length) {
    const currentWord = words[i];
    const nextWord = words[i + 1];

    if (TENS.includes(currentWord) && ONES.includes(nextWord)) {
      results.push(String(Number(currentWord) + Number(nextWord)));
      i += 2;
    } else {
      results.push(currentWord);
      i += 1;
    }
  }

  return results.join(" ");
}

/**
 * Case 3: Join hundreds -> Multiple the number before it
 */

export function isWholeNumber(word: string | undefined): boolean {
  return word !== undefined && /^\d+$/.test(word);
}

export function joinHundreds(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  let i = 0;

  while (i < words.length) {
    const currentWord = words[i];
    const nextWord = words[i + 1];

    if (isWholeNumber(currentWord) && nextWord === "hundred") {
      let value = Number(currentWord) * 100; // "1 hundred" -> 100
      let usedIndexes = 2; // "1" and hundred

      // check about "and"

      const after = words[i + 2];
      const afterAnd = words[i + 3];

      if (after === "and" && isWholeNumber(afterAnd)) {
        value += Number(afterAnd);
        usedIndexes = 4;
      } else if (isWholeNumber(after)) {
        value += Number(after);
        usedIndexes = 3;
      }
      results.push(String(value));
      i += usedIndexes;
    } else {
      results.push(currentWord);
      i += 1;
    }
  }

  return results.join(" ");
}

/**
 * Case 4: "Point" between two numbers is a decimal point
 * EX: "2 point 5" and "point 5" -> 0.5
 */

export function joinDecimals(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  let i = 0;

  while (i < words.length) {
    const currentWord = words[i];
    const nextWord = words[i + 1];

    if (currentWord === "point" && isWholeNumber(nextWord)) {
      const lastPushed = results[results.length - 1];
      const prevWord = isWholeNumber(lastPushed) ? results.pop()! : "0";

      const newValue = prevWord + "." + nextWord;
      results.push(newValue);
      i += 2;
    } else {
      results.push(currentWord);
      i += 1;
    }
  }

  return results.join(" ");
}

/**
 * Case 5: A fraction right after a number gets added to it
 * EX: 3 and a half -> 3.5, "3 and a quarter" -> "3.25"
 * EX: "4 1/2" -> "4.5"
 */

const FRACTION_WORDS: Record<string, number> = { half: 0.5, quarter: 0.25 };
const FRACTION_SYMBOLS: Record<string, number> = {
  "1/2": 0.5,
  "½": 0.5,
  "1/4": 0.25,
  "¼": 0.25,
};

export function addFractionsToNumber(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  let i = 0;

  while (i < words.length) {
    const currentWord = words[i];
    const nextWord = words[i + 1];

    // 3 and a half OR 3 and half
    if (isWholeNumber(currentWord) && nextWord === "and") {
      let j = i + 2; // the word after "and"

      if (words[j] === "a") {
        j += 1;
      } // skip the optional "a"
      const fractionalWord = words[j];
      if (fractionalWord !== undefined && fractionalWord in FRACTION_WORDS) {
        results.push(
          String(Number(currentWord) + FRACTION_WORDS[fractionalWord]),
        );
        i = j + 1; // jump after fraction word
        continue;
      }
    }

    // "4 1/2 "

    if (
      isWholeNumber(currentWord) &&
      nextWord !== undefined &&
      nextWord in FRACTION_SYMBOLS
    ) {
      results.push(String(Number(currentWord) + FRACTION_SYMBOLS[nextWord]));
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
 * EX: half an ounce -> 0.5 an ounce
 * # quarter ounce -> 0.25 ounce
 */

export function fractionOnItsOwn(text: string): string {
  const words = text.split(" ");
  const results: string[] = [];

  for (const word of words) {
    const value =
      word in FRACTION_WORDS
        ? FRACTION_WORDS[word]
        : word in FRACTION_SYMBOLS
          ? FRACTION_SYMBOLS[word]
          : undefined;

    if (value === undefined) {
      results.push(word);
      continue;
    }

    results.push(String(value));
  }

  return results.join(" ");
}
