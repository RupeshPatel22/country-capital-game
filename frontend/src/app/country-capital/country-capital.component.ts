import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { GameApiService } from './game-api.service';
import { GameStateService } from './game-state.service';
import {
  ButtonState,
  GameStatus,
  type Data,
  type GameButton,
  type GameResults,
} from './game.types';

const RemoteKind = {
  Loading: 'loading',
  Ok: 'ok',
  Error: 'error',
} as const;

type RemoteData =
  | { kind: typeof RemoteKind.Loading }
  | { kind: typeof RemoteKind.Ok; data: Data }
  | { kind: typeof RemoteKind.Error };

/**
 * @description Country / capital matching game. Fetches its pairs from `GET /api/game`
 * (falling back to the `data` input on demand), runs the board through
 * {@link GameStateService}, and reports the finished game up via `gameCompleted` and to
 * `POST /api/game/results`.
 */
@Component({
  selector: 'app-country-capital',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GameStateService],
  templateUrl: './country-capital.component.html',
  styleUrl: './country-capital.component.scss',
})
export class CountryCapitalComponent {
  private readonly state = inject(GameStateService);
  private readonly gameApi = inject(GameApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = input.required<Data>();
  readonly gameCompleted = output<GameResults>();

  private readonly reload = new Subject<void>();
  private readonly remoteData = toSignal(
    this.reload.pipe(
      startWith(undefined),
      switchMap(() =>
        this.gameApi.getGameData().pipe(
          map((data): RemoteData => ({ kind: RemoteKind.Ok, data })),
          catchError(() => of<RemoteData>({ kind: RemoteKind.Error })),
          startWith<RemoteData>({ kind: RemoteKind.Loading }),
        ),
      ),
    ),
    { initialValue: { kind: RemoteKind.Loading } as RemoteData },
  );

  private completionSent = false;

  protected readonly status = this.state.status;
  protected readonly buttons = this.state.buttons;
  protected readonly streak = this.state.streak;
  protected readonly wrongAttempts = this.state.wrongAttempts;
  protected readonly hintsUsed = this.state.hintsUsed;
  protected readonly matchedPairs = this.state.matchedPairs;
  protected readonly elapsedSeconds = this.state.elapsedSeconds;
  protected readonly remaining = this.state.remaining;
  protected readonly canUseHint = this.state.canUseHint;
  protected readonly hasOfflineData = computed(() => Object.keys(this.data()).length > 0);

  protected readonly GameStatus = GameStatus;
  protected readonly ButtonState = ButtonState;

  constructor() {
    effect(() => this.applyRemoteData(this.remoteData()));
    effect(() => {
      const results = this.state.results();
      this.completionSent = results ? this.completionSent : false;
      if (results) this.completeGame(results);
    });
    this.destroyRef.onDestroy(() => this.state.dispose());
  }

  /**
   * @description Handles a board button click.
   * @param button the button that was clicked
   */
  protected selectButton(button: GameButton): void {
    this.state.selectButton(button);
  }

  /**
   * @description Reveals the capital matching the selected country for two seconds.
   */
  protected useHint(): void {
    this.state.useHint();
  }

  /**
   * @description Re-requests the pairs after a failed fetch.
   */
  protected retryFetch(): void {
    this.reload.next();
  }

  /**
   * @description Starts the game from the `data` input instead of the API.
   */
  protected useOfflineData(): void {
    this.state.startGame(this.data());
  }

  /**
   * @description Moves the game state machine in step with the pairs request.
   * @param remote the resolved request state
   */
  private applyRemoteData(remote: RemoteData): void {
    if (remote.kind === RemoteKind.Loading) {
      this.state.setLoading();
      return;
    }
    if (remote.kind === RemoteKind.Ok) {
      this.state.startGame(remote.data);
      return;
    }
    this.state.setError();
  }

  /**
   * @description Emits the finished game upward and posts it to the results endpoint. Runs
   * once per game; the POST failing is swallowed so a completed game still reads as done.
   * @param results elapsed seconds, wrong attempts and hints used
   */
  private completeGame(results: GameResults): void {
    if (this.completionSent) return;
    this.completionSent = true;

    this.gameCompleted.emit(results);
    this.gameApi
      .submitResults(results)
      .subscribe({ next: () => undefined, error: () => undefined });
  }
}
