import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { KEY_NO_AUTH } from '../constants/api-constants';
import { addToken } from './error.interceptor';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authToken = inject(AuthService).getAuthToken();
  if (req.headers.has(KEY_NO_AUTH)) {
    const headers = req.headers.delete(KEY_NO_AUTH);
    const clonedReq = req.clone({ headers });
    return next(clonedReq);
  }

  const newReq = addToken(req, authToken)
  return next(newReq);
}


