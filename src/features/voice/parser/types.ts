// OUTPUT OF VOICE PARSER

export type FeedType = "breast" | "bottle" | "formula";
export type VolumeUnit = "oz" | "ml";
export type MeasurementMetric = "weight" | "length" | "head";
export type MeasurementUnit = "lb" | "kg" | "g" | "in" | "cm";

export type ParsedCommand =
  | {
      kind: "feeding";
      babyName?: string;
      feedType?: FeedType;
      amount?: number;
      unit?: VolumeUnit;
      approximate: boolean;
    }
  | {
      kind: "diaper";
      babyName?: string;
      pee: boolean;
      poop: boolean;
    }
  | {
      kind: "measurement";
      babyName?: string;
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
