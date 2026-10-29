import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initSkeletonStagger } from './app/shared/utils/skeleton-stagger';

initSkeletonStagger();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
