import { normalizeNumbers } from "../numberWords";

describe("normalizeNumbers", () => {
  describe("number words (words-to-numbers)", () => {
    test.each([
      ["three ounces", "3 ounces"],
      ["twenty five ml", "25 ml"],
      ["twenty-five ml", "25 ml"],
      ["one hundred twenty ml", "120 ml"],
      ["two point five ounces", "2.5 ounces"],
    ])('"%s" -> "%s"', (input, expected) => {
      expect(normalizeNumbers(input)).toBe(expected);
    });
  });

  describe("number + fraction", () => {
    test.each([
      ["Three and a half ounces", "3.5 ounces"],
      ["three and one half ounces", "3.5 ounces"],
      ["one and a quarter cups", "1.25 cups"],
      ["4 1/2 oz", "4.5 oz"],
      ["4 1/2oz", "4.5 oz"],
      ["4½ oz", "4.5 oz"],
    ])('"%s" -> "%s"', (input, expected) => {
      expect(normalizeNumbers(input)).toBe(expected);
    });
  });

  describe("fraction on its own", () => {
    test.each([
      ["half an ounce", "0.5 ounce"],
      ["a quarter cup", "0.25 cup"],
      ["a half cup", "0.5 cup"],
      ["one half cup", "0.5 cup"],
    ])('"%s" -> "%s"', (input, expected) => {
      expect(normalizeNumbers(input)).toBe(expected);
    });
  });

  describe("words that should be left alone", () => {
    test.each([["two ounces of half and half", "2 ounces of half and half"]])(
      '"%s" -> "%s"',
      (input, expected) => {
        expect(normalizeNumbers(input)).toBe(expected);
      },
    );
  });

  describe("'a' and 'an' are not numbers", () => {
    test.each([
      ["emma had a bottle", "emma had a bottle"],
      ["emma nursed for a long time", "emma nursed for a long time"],
      ["liam had a wet diaper", "liam had a wet diaper"],
    ])("%s -> unchanged", (input, expected) => {
      expect(normalizeNumbers(input)).toBe(expected);
    });

    test.each([
      ["three and a half ounces", "3.5 ounces"],
      ["a half ounce", "0.5 ounce"],
      ["half an ounce", "0.5 ounce"],
      ["twenty five ml", "25 ml"],
    ])("numbers still convert: %s -> %s", (input, expected) => {
      expect(normalizeNumbers(input)).toBe(expected);
    });
  });
});
