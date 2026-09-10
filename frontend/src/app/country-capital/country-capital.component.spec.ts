import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CountryCapitalComponent } from './country-capital.component';
import { ButtonState, type Data, type GameResults } from './game.types';

const TWO_PAIRS: Data = { Germany: 'Berlin', France: 'Paris' };
const ONE_PAIR: Data = { Germany: 'Berlin' };

describe('CountryCapitalComponent', () => {
  let fixture: ComponentFixture<CountryCapitalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      imports: [CountryCapitalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CountryCapitalComponent);
    fixture.componentRef.setInput('data', TWO_PAIRS);
    TestBed.tick();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Answers the in-flight `GET /api/game` with a data set and renders the board. */
  function flushPairs(pairs: Data): void {
    httpMock.expectOne('/api/game').flush({ pairs });
    TestBed.tick();
  }

  function testId(id: string): DebugElement | null {
    return fixture.debugElement.query(By.css(`[data-testid="${id}"]`));
  }

  function text(id: string): string {
    return (testId(id)?.nativeElement.textContent ?? '').trim();
  }

  function tiles(): DebugElement[] {
    return fixture.debugElement.queryAll(By.css('[data-testid="tile"]'));
  }

  function tileFor(label: string): HTMLButtonElement | undefined {
    return tiles()
      .map((candidate) => candidate.nativeElement as HTMLButtonElement)
      .find((element) => element.dataset['label'] === label);
  }

  function tileState(label: string): string | undefined {
    return tileFor(label)?.dataset['state'];
  }

  function clickTile(label: string): void {
    tileFor(label)?.click();
    TestBed.tick();
  }

  function clickTestId(id: string): void {
    testId(id)?.nativeElement.click();
    TestBed.tick();
  }

  it('shows the loading state while the pairs request is in flight', () => {
    expect(testId('loading')).toBeTruthy();
    expect(testId('board')).toBeNull();
    httpMock.expectOne('/api/game');
  });

  it('shows the error state when the pairs request fails, and retry re-requests', () => {
    httpMock.expectOne('/api/game').error(new ProgressEvent('network'));
    TestBed.tick();

    expect(testId('error')).toBeTruthy();

    clickTestId('error-retry');
    expect(testId('loading')).toBeTruthy();
    httpMock.expectOne('/api/game');
  });

  it('clears a correct country / capital pair and counts the streak', () => {
    flushPairs(TWO_PAIRS);

    clickTile('Germany');
    clickTile('Berlin');

    expect(tileState('Germany')).toBeUndefined();
    expect(tileState('Berlin')).toBeUndefined();
    expect(tiles()).toHaveLength(2);
    expect(text('streak')).toBe('1');
    expect(text('matches')).toBe('1');
  });

  it('marks a wrong pair red and resets the streak', () => {
    flushPairs(TWO_PAIRS);

    clickTile('Germany');
    clickTile('Paris');

    expect(tileState('Germany')).toBe(ButtonState.Wrong);
    expect(tileState('Paris')).toBe(ButtonState.Wrong);
    expect(text('wrong-attempts')).toBe('1');
    expect(text('streak')).toBe('0');
  });

  it('restores both red buttons on the third click and selects the new one', () => {
    flushPairs(TWO_PAIRS);

    clickTile('Germany');
    clickTile('Paris');
    clickTile('Berlin');

    expect(tileState('Germany')).toBe(ButtonState.Default);
    expect(tileState('Paris')).toBe(ButtonState.Default);
    expect(tileState('Berlin')).toBe(ButtonState.Selected);
  });

  it('counts consecutive correct matches and drops back to zero after a wrong pair', () => {
    flushPairs({ Germany: 'Berlin', France: 'Paris', Japan: 'Tokyo', Peru: 'Lima' });

    clickTile('Germany');
    clickTile('Berlin');
    clickTile('France');
    clickTile('Paris');
    expect(text('streak')).toBe('2');

    clickTile('Japan');
    clickTile('Lima');
    expect(text('streak')).toBe('0');
  });

  it('highlights the matching capital for two seconds when a hint is used', () => {
    flushPairs(TWO_PAIRS);

    clickTile('Germany');
    clickTestId('hint-button');

    expect(tileState('Berlin')).toBe(ButtonState.Hinted);
    expect(text('hints-used')).toBe('1');
    expect(text('streak')).toBe('0');

    vi.advanceTimersByTime(2000);
    TestBed.tick();

    expect(tileState('Berlin')).toBe(ButtonState.Default);
  });

  it('cleans up the pending hint timer when the component is destroyed', () => {
    flushPairs(TWO_PAIRS);

    clickTile('Germany');
    clickTestId('hint-button');

    fixture.destroy();

    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
  });

  it('announces completion, emits the result and posts it once the board is cleared', () => {
    const emitted: GameResults[] = [];
    fixture.componentInstance.gameCompleted.subscribe((result) => emitted.push(result));

    flushPairs(ONE_PAIR);

    clickTile('Germany');
    clickTile('Berlin');

    expect(testId('congratulations')).toBeTruthy();

    const post = httpMock.expectOne('/api/game/results');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ elapsedSeconds: 0, wrongAttempts: 0, hintsUsed: 0 });
    post.flush(null);

    expect(emitted).toEqual([{ elapsedSeconds: 0, wrongAttempts: 0, hintsUsed: 0 }]);
  });
});
