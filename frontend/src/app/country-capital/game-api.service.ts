import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Data, GameResults } from './game.types';

type GameDataResponse = { pairs: Data };

@Injectable({ providedIn: 'root' })
export class GameApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = '/api/game';

  /**
   * @description Fetches the country/capital pairs the board is built from.
   * @returns a stream that emits the pairs once, then completes
   */
  getGameData(): Observable<Data> {
    return this.http.get<GameDataResponse>(this.baseUrl).pipe(map((response) => response.pairs));
  }

  /**
   * @description Submits the stats for a completed game.
   * @param results elapsed seconds, wrong attempts and hints used
   * @returns a stream that completes when the server has accepted the submission
   */
  submitResults(results: GameResults): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/results`, results);
  }
}
