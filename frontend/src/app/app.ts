import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CountryCapitalComponent } from './country-capital/country-capital.component';
import type { Data, GameResults } from './country-capital/game.types';

@Component({
  selector: 'app-root',
  imports: [CountryCapitalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly fallbackData: Data = {
    Germany: 'Berlin',
    Azerbaijan: 'Baku',
    Poland: 'Warsaw',
    'Papua New Guinea': 'Port Moresby',
  };

  protected readonly lastResult = signal<GameResults | null>(null);

  /**
   * @description Stores the stats emitted when a game finishes so the shell can show them.
   * @param results elapsed seconds, wrong attempts and hints used
   */
  protected onGameCompleted(results: GameResults): void {
    this.lastResult.set(results);
  }
}
