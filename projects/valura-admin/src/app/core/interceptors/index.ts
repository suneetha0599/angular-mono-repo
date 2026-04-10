import { withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { loggingInterceptor, } from './logging.interceptor';
import { errorInterceptor } from './error.interceptor';

export const httpInterceptorProviders = withInterceptors([
    loggingInterceptor,
    authInterceptor,
    errorInterceptor
]);