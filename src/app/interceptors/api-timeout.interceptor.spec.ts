import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiTimeoutNoticeService } from '../services/api-timeout-notice.service';
import { API_TIMEOUT_MS, apiTimeoutInterceptor } from './api-timeout.interceptor';

describe('apiTimeoutInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => vi.useRealTimers());

  it('cancela una solicitud de API lenta y avisa al usuario a los 30 segundos', () => {
    const notice = TestBed.inject(ApiTimeoutNoticeService);
    let cancelled = false;
    let received: HttpErrorResponse | undefined;
    const request = new HttpRequest('GET', `${environment.apiUrl}/donaciones`);
    const response = TestBed.runInInjectionContext(() => apiTimeoutInterceptor(request, () =>
      new Observable(() => () => { cancelled = true; })));

    response.subscribe({ error: (error) => { received = error; } });
    vi.advanceTimersByTime(API_TIMEOUT_MS - 1);
    expect(received).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(received?.status).toBe(504);
    expect(cancelled).toBe(true);
    expect(notice.message()).toContain('30 segundos');
  });

  it('no dispara alertas cuando la API responde a tiempo', () => {
    const notice = TestBed.inject(ApiTimeoutNoticeService);
    const request = new HttpRequest('GET', `${environment.apiUrl}/locales`);
    let status: number | undefined;
    TestBed.runInInjectionContext(() => apiTimeoutInterceptor(request, () =>
      of(new HttpResponse({ status: 200 })))).subscribe((event) => {
      if (event instanceof HttpResponse) status = event.status;
    });
    vi.advanceTimersByTime(API_TIMEOUT_MS);
    expect(status).toBe(200);
    expect(notice.message()).toBe('');
  });
});
