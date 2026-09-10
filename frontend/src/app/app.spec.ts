import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders the game heading and hosts the game component', () => {
    const fixture = TestBed.createComponent(App);
    TestBed.tick();

    TestBed.inject(HttpTestingController)
      .expectOne('/api/game')
      .flush({ pairs: { Germany: 'Berlin' } });

    const title = fixture.debugElement.query(By.css('[data-testid="app-title"]'));
    expect(title.nativeElement.textContent).toContain('Country / Capital Game');
    expect(fixture.debugElement.query(By.css('[data-testid="game"]'))).toBeTruthy();
  });
});
