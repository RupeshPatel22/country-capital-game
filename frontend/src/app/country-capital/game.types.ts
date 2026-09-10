import { RemoteKind } from './game.constants';


export type Data = Record<string, string>;

export const ButtonKind = {
  Country: 'country',
  Capital: 'capital',
} as const;
export type ButtonKind = (typeof ButtonKind)[keyof typeof ButtonKind];

export const ButtonState = {
  Default: 'default',
  Selected: 'selected',
  Wrong: 'wrong',
  Hinted: 'hinted',
} as const;
export type ButtonState = (typeof ButtonState)[keyof typeof ButtonState];

export type GameButton = {
  id: string;
  label: string;
  kind: ButtonKind;
  partnerLabel: string;
  state: ButtonState;
};

export const GameStatus = {
  Loading: 'loading',
  Error: 'error',
  Playing: 'playing',
  Won: 'won',
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export type GameResults = {
  elapsedSeconds: number;
  wrongAttempts: number;
  hintsUsed: number;
};

export type RemoteData =
  | { kind: typeof RemoteKind.Loading }
  | { kind: typeof RemoteKind.Ok; data: Data }
  | { kind: typeof RemoteKind.Error };

/**
 * @description Builds the unshuffled list of buttons for a data set: one country button
 * and one capital button per pair, cross-linked by `partnerLabel`.
 * @param data country -> capital lookup
 * @returns two buttons per entry, all in the `default` state
 */
export function buildButtons(data: Data): GameButton[] {
  const buttons: GameButton[] = [];

  for (const [country, capital] of Object.entries(data)) {
    buttons.push({
      id: `country:${country}`,
      label: country,
      kind: ButtonKind.Country,
      partnerLabel: capital,
      state: ButtonState.Default,
    });
    buttons.push({
      id: `capital:${capital}`,
      label: capital,
      kind: ButtonKind.Capital,
      partnerLabel: country,
      state: ButtonState.Default,
    });
  }

  return buttons;
}

/**
 * @description Returns a new array with the items in random order (Fisher-Yates). Does not
 * mutate the input, so it is safe to call inside a signal update.
 * @param items source list
 * @returns a shuffled copy
 */
export function shuffle<ItemType>(items: readonly ItemType[]): ItemType[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index--) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
  }

  return copy;
}

/**
 * @description True when two buttons are a country and its matching capital.
 * @param first one selected button
 * @param second the other selected button
 * @returns whether the pair is correct
 */
export function isCorrectPair(first: GameButton, second: GameButton): boolean {
  return first.partnerLabel === second.label && second.partnerLabel === first.label;
}
