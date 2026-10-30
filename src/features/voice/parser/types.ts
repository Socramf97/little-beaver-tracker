// OUTPUT OF VOICE PARSER

export type FeedType = "breast" | "bottle" | "formula";
export type VolumeUnit = "oz" | "ml";
export type MeasurementMetric = "weight" | "length" | "head";
export type MeasurementUnit = "lb" | "kg" | "g" | "in" | "cm";
export type BabyRef = { id: string; name: string };
export type ParsedCommand =
  | {
      kind: "feeding";
      baby?: BabyRef;
      feedType?: FeedType;
      amount?: number;
      unit?: VolumeUnit;
      approximate: boolean;
    }
  | {
      kind: "diaper";
      baby?: BabyRef;
      pee: boolean;
      poop: boolean;
    }
  | {
      kind: "measurement";
      baby?: BabyRef;
      metric: MeasurementMetric;
      value?: number;
      unit?: MeasurementUnit;
      approximate: boolean;
    }
  | { kind: "unknown" };

export type MissingFields =
  | "babyName"
  | "feedType"
  | "amount"
  | "diaperContents"
  | "measurementValue";

export interface ParseResult {
  command: ParsedCommand;
  missing: MissingFields[];
  // Trasncript is later used to read back to the UI
  transcript: string;
}
