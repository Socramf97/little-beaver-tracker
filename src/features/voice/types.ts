// OUTPUT OF VOICE PARSER
import type {
  DiaperType,
  FeedingType,
  VolumeUnit,
} from "@/features/events/types";

export type MeasurementMetric = "weight" | "length" | "head";
export type MeasurementUnit = "lb" | "kg" | "g" | "in" | "cm";
export type BabyRef = { id: string; name: string };
export type CommandKind = "feeding" | "diaper" | "measurement" | "unknown";

export type ParsedCommand =
  | {
      kind: "feeding";
      baby?: BabyRef;
      feedType?: FeedingType;
      amount?: number;
      unit?: VolumeUnit;
      approximate: boolean;
    }
  | {
      kind: "diaper";
      baby?: BabyRef;
      diaperType?: DiaperType;
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

export interface ParsedResult {
  command: ParsedCommand;
  // Trasncript is later used to read back to the UI
  transcript: string;
}
