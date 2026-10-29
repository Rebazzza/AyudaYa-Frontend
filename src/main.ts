import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initPanelReveal } from './app/shared/utils/skeleton-stagger';

initPanelReveal();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
