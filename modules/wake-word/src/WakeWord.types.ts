// Events that swift module writes to and our UI subscribes to
export type WakeWordModuleEvents = {
  onChange: (params: { value: string }) => void;

  onWakeWord: (params: { name: string; confidence: number }) => void;
};

export type ChangeEventPayload = {
  value: string;
};
