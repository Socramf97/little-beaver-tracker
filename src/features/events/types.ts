// Field names match the database schema
export type EventKind = "feeding" | "diaper" | "measurement";
export type FeedingType = "breast" | "bottle" | "formula";
export type VolumeUnit = "oz" | "mL";
export type DiaperType = "pee" | "poop" | "both";

// Fields every event has
type BaseEvent = {
  id: string;
  babyId: string;
  timestamp: Date;
  notes?: string;
};

export type FeedingEvent = BaseEvent & {
  kind: "feeding";
  feedingType: FeedingType;
  amount?: number;
  unit?: VolumeUnit;
  isApproximate: boolean;
};

export type DiaperEvent = BaseEvent & {
  kind: "diaper";
  diaperType: DiaperType;
};

export type MeasurementEvent = BaseEvent & {
  kind: "measurement";
  weightKg?: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
};

export type BabyEvent = FeedingEvent | DiaperEvent | MeasurementEvent;

// A valid event that hasn't been saved yet, so it has no id.
// The id is created when the event is saved.
export type NewBabyEvent =
  | Omit<FeedingEvent, "id">
  | Omit<DiaperEvent, "id">
  | Omit<MeasurementEvent, "id">;

// Contains raw input from voice or a form before it's checked.
// Fields can be missing or wrong. Validation checks it before saving.
export type EventDraft = {
  kind?: string;
  babyId?: string;
  timestamp?: Date;
  notes?: string;

  // feeding
  feedingType?: string;
  amount?: number;
  unit?: string;
  isApproximate?: boolean;

  // diaper
  diaperType?: string;

  // measurement
  weightKg?: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
};
