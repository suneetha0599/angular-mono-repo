import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { httpInterceptorProviders } from './core/interceptors';
import { provideAnimations } from '@angular/platform-browser/animations';
import { GlobalErrorHandler } from '@valura-lib/utils/global-error-handler';
import { provideNgToast, TOAST_POSITIONS } from 'ng-angular-popup';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(httpInterceptorProviders),
    provideAnimations(),
    provideNgToast({
      position: TOAST_POSITIONS.TOP_RIGHT,
      duration: 5000,
      showProgress: true,
      dismissible: true,
      showIcon: true
    }),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    importProvidersFrom(
      LoggerModule.forRoot({
        level: NgxLoggerLevel.DEBUG,
        serverLogLevel: NgxLoggerLevel.OFF
      })
    )
  ]
};
