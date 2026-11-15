import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { usuarioIdInterceptor } from './interceptors/usuario-id.interceptor';
import { apiTimeoutInterceptor } from './interceptors/api-timeout.interceptor';
import { PriorityPreloadingStrategy } from './routing/priority-preloading.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PriorityPreloadingStrategy)),
    provideHttpClient(withInterceptors([usuarioIdInterceptor, apiTimeoutInterceptor])),
  ],
};
