import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PriorityPreloadingStrategy } from './priority-preloading.strategy';

describe('PriorityPreloadingStrategy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });
  afterEach(() => vi.useRealTimers());

  it('precarga solo las rutas marcadas, después de la navegación inicial', () => {
    const strategy = TestBed.inject(PriorityPreloadingStrategy);
    let loads = 0;
    const load = () => { loads++; return of('vista'); };
    strategy.preload({ path: 'auditoria' }, load).subscribe();
    strategy.preload({ path: 'donaciones', data: { preload: true } }, load).subscribe();
    expect(loads).toBe(0);
    vi.advanceTimersByTime(750);
    expect(loads).toBe(1);
  });
});
