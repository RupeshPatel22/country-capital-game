import { Injectable, computed, signal } from '@angular/core';
import {
  ButtonKind,
  ButtonState,
  GameStatus,
  buildButtons,
  isCorrectPair,
  shuffle,
  type Data,
  type GameButton,
  type GameResults,
} from './game.types';

const HINT_DURATION_MS = 2000;

const INITIAL_COUNTERS = {
  streak: 0,
  wrongAttempts: 0,
  hintsUsed: 0,
  matchedPairs: 0,
  elapsedSeconds: 0,
};

@Injectable()
export class GameStateService {
  private readonly statusSignal = signal<GameStatus>(GameStatus.Loading);
  private readonly buttonsSignal = signal<GameButton[]>([]);
  private readonly selectedIdsSignal = signal<string[]>([]);
  private readonly streakSignal = signal(INITIAL_COUNTERS.streak);
  private readonly wrongAttemptsSignal = signal(INITIAL_COUNTERS.wrongAttempts);
  private readonly hintsUsedSignal = signal(INITIAL_COUNTERS.hintsUsed);
  private readonly matchedPairsSignal = signal(INITIAL_COUNTERS.matchedPairs);
  private readonly elapsedSecondsSignal = signal(INITIAL_COUNTERS.elapsedSeconds);
  private readonly resultsSignal = signal<GameResults | null>(null);

  private elapsedTimer: ReturnType<typeof setInterval> | null = null;
  private elapsedStartMs = 0;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private hintedButtonId: string | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly buttons = this.buttonsSignal.asReadonly();
  readonly streak = this.streakSignal.asReadonly();
  readonly wrongAttempts = this.wrongAttemptsSignal.asReadonly();
  readonly hintsUsed = this.hintsUsedSignal.asReadonly();
  readonly matchedPairs = this.matchedPairsSignal.asReadonly();
  readonly elapsedSeconds = this.elapsedSecondsSignal.asReadonly();
  readonly results = this.resultsSignal.asReadonly();

  readonly remaining = computed(() => this.buttonsSignal().length);

  private readonly selectedButtons = computed(() => {
    const boardButtons = this.buttonsSignal();
    return this.selectedIdsSignal()
      .map((selectedId) => boardButtons.find((button) => button.id === selectedId))
      .filter((button): button is GameButton => button !== undefined);
  });

  readonly canUseHint = computed(() => {
    const selectedButtons = this.selectedButtons();
    return (
      this.statusSignal() === GameStatus.Playing &&
      selectedButtons.length === 1 &&
      selectedButtons[0].kind === ButtonKind.Country
    );
  });

  /**
   * @description Builds a fresh shuffled board from a data set and starts the game clock.
   * @param data country -> capital pairs to play with
   */
  startGame(data: Data): void {
    this.clearTimers();
    this.buttonsSignal.set(shuffle(buildButtons(data)));
    this.selectedIdsSignal.set([]);
    this.resetCounters();
    this.resultsSignal.set(null);
    this.hintedButtonId = null;
    this.statusSignal.set(GameStatus.Playing);
    this.startClock();
  }

  /**
   * @description Marks the component as waiting for the pairs request.
   */
  setLoading(): void {
    this.statusSignal.set(GameStatus.Loading);
  }

  /**
   * @description Marks the pairs request as failed so the template can show the error state.
   */
  setError(): void {
    this.clearTimers();
    this.statusSignal.set(GameStatus.Error);
  }

  /**
   * @description Applies a button click per the game rules: clears a stale wrong pair,
   * selects the button blue, and resolves the pair once two are selected.
   * @param button the button that was clicked
   */
  selectButton(button: GameButton): void {
    if (this.statusSignal() !== GameStatus.Playing) return;
    if (this.selectedIdsSignal().includes(button.id)) return;

    this.dismissHint();

    if (this.selectedIdsSignal().length === 2) {
      this.clearStaleWrongPair();
    }

    this.setButtonsState([button.id], ButtonState.Selected);
    this.selectedIdsSignal.update((selectedIds) => [...selectedIds, button.id]);

    const selectedButtons = this.selectedButtons();
    if (selectedButtons.length === 2) {
      this.resolvePair(selectedButtons[0], selectedButtons[1]);
    }
  }

  /**
   * @description Highlights the capital that matches the selected country for two seconds,
   * then reverts it. Counts against the hint total and breaks the streak.
   */
  useHint(): void {
    if (!this.canUseHint()) return;

    const selectedCountry = this.selectedButtons()[0];
    const partnerCapital = this.buttonsSignal().find(
      (button) => button.label === selectedCountry.partnerLabel,
    );
    if (!partnerCapital) return;

    this.dismissHint();
    this.hintedButtonId = partnerCapital.id;
    this.setButtonsState([partnerCapital.id], ButtonState.Hinted);
    this.hintsUsedSignal.update((hintsUsed) => hintsUsed + 1);
    this.streakSignal.set(0);

    this.hintTimer = setTimeout(() => {
      this.hintTimer = null;
      this.dismissHint();
    }, HINT_DURATION_MS);
  }

  /**
   * @description Stops every pending timer. Call from the component's destroy hook so a
   * hint or clock tick cannot fire after the view is gone.
   */
  dispose(): void {
    this.clearTimers();
  }

  /**
   * @description Resets the per-game counters to their initial values.
   */
  private resetCounters(): void {
    this.streakSignal.set(INITIAL_COUNTERS.streak);
    this.wrongAttemptsSignal.set(INITIAL_COUNTERS.wrongAttempts);
    this.hintsUsedSignal.set(INITIAL_COUNTERS.hintsUsed);
    this.matchedPairsSignal.set(INITIAL_COUNTERS.matchedPairs);
    this.elapsedSecondsSignal.set(INITIAL_COUNTERS.elapsedSeconds);
  }

  /**
   * @description Starts the 1s game clock, derived from wall-clock time so it does not
   * drift over a long game.
   */
  private startClock(): void {
    this.elapsedStartMs = Date.now();
    this.elapsedTimer = setInterval(() => {
      this.elapsedSecondsSignal.set(Math.floor((Date.now() - this.elapsedStartMs) / 1000));
    }, 1000);
  }

  /**
   * @description Returns the last (incorrect) pair to its default colour and clears the
   * selection, so the next click starts a fresh turn.
   */
  private clearStaleWrongPair(): void {
    this.setButtonsState(this.selectedIdsSignal(), ButtonState.Default);
    this.selectedIdsSignal.set([]);
  }

  /**
   * @description Resolves the two selected buttons: clear them on a correct pair (and end
   * the game if the board is now empty), otherwise turn both red and reset the streak.
   * @param firstPick the button picked first this turn
   * @param secondPick the button picked second this turn
   */
  private resolvePair(firstPick: GameButton, secondPick: GameButton): void {
    if (isCorrectPair(firstPick, secondPick)) {
      this.buttonsSignal.update((buttons) =>
        buttons.filter((button) => button.id !== firstPick.id && button.id !== secondPick.id),
      );
      this.selectedIdsSignal.set([]);
      this.streakSignal.update((streak) => streak + 1);
      this.matchedPairsSignal.update((matchedPairs) => matchedPairs + 1);

      if (this.buttonsSignal().length === 0) {
        this.finishGame();
      }
      return;
    }

    this.setButtonsState([firstPick.id, secondPick.id], ButtonState.Wrong);
    this.wrongAttemptsSignal.update((wrongAttempts) => wrongAttempts + 1);
    this.streakSignal.set(0);
  }

  /**
   * @description Stops the clock, marks the game won, and publishes the final stats once.
   */
  private finishGame(): void {
    this.clearTimers();
    this.statusSignal.set(GameStatus.Won);
    this.resultsSignal.set({
      elapsedSeconds: this.elapsedSecondsSignal(),
      wrongAttempts: this.wrongAttemptsSignal(),
      hintsUsed: this.hintsUsedSignal(),
    });
  }

  /**
   * @description Sets the state of every button whose id is in `ids`, leaving the rest
   * untouched.
   * @param ids the button ids to update
   * @param state the state to apply
   */
  private setButtonsState(ids: readonly string[], state: GameButton['state']): void {
    const targetIds = new Set(ids);
    this.buttonsSignal.update((buttons) =>
      buttons.map((button) => (targetIds.has(button.id) ? { ...button, state } : button)),
    );
  }

  /**
   * @description Cancels a showing hint: stops its timer and returns the highlighted
   * button to its default look if it is still on the board and still highlighted.
   */
  private dismissHint(): void {
    this.clearHintTimer();
    if (this.hintedButtonId === null) return;

    const hintedId = this.hintedButtonId;
    this.hintedButtonId = null;
    this.buttonsSignal.update((buttons) =>
      buttons.map((button) =>
        button.id === hintedId && button.state === ButtonState.Hinted
          ? { ...button, state: ButtonState.Default }
          : button,
      ),
    );
  }

  /**
   * @description Clears both the game clock and any pending hint timer.
   */
  private clearTimers(): void {
    if (this.elapsedTimer !== null) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
    this.clearHintTimer();
  }

  /**
   * @description Clears the pending hint revert timer, if one is running.
   */
  private clearHintTimer(): void {
    if (this.hintTimer !== null) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }
}
