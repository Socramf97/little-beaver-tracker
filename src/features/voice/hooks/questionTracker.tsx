export const MAX_SAME_QUESTIONS = 3;

export type QuestionState = { lastField: string | null; count: number };

export const EMPTY_QUESTIONS: QuestionState = { lastField: null, count: 0 };

// This tracks if the same question is asked more than 3 times, it will show a add manual button instead of asking the same question over and over.
export function trackQuestion(state: QuestionState, field: string) {
  const count = state.lastField === field ? state.count + 1 : 1;
  return {
    state: { lastField: field, count },
    stuck: count > MAX_SAME_QUESTIONS,
  };
}
