export const HINT_DURATION_MS = 2000;

export const INITIAL_COUNTERS = {
  streak: 0,
  wrongAttempts: 0,
  hintsUsed: 0,
  matchedPairs: 0,
  elapsedSeconds: 0,
};

export const RemoteKind = {
  Loading: 'loading',
  Ok: 'ok',
  Error: 'error',
} as const;
