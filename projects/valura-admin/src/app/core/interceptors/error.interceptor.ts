import { HttpRequest, HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpEvent, HttpHandler } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { KEY_AUTHORIZATION, OPEN_URL_LIST } from '../constants/api-constants';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiConfigService } from '@admin-core/services/api-config.service';



let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  const authService = inject(AuthService);
  const sbService = inject(SnackbarService);
  const apiConfigService = inject(ApiConfigService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // console.log(`error ${error} ${error.status}`)
      const urlWithoutParams = req.url.split('?')[0]; // to fetch only query url without params
      const queryUrl1 = urlWithoutParams.replace(apiConfigService.serverUrl, '');
      const queryUrl2 = urlWithoutParams.replace(apiConfigService.defaultServerUrl, '');
      let openUrl = (OPEN_URL_LIST.includes(`${queryUrl1}`)) || (OPEN_URL_LIST.includes(`${queryUrl2}`)) ? true : false

      if (authService.isRefreshTokenExpired && !openUrl) {
        sbService.openSnack('Session Expired');
        authService.logOut();
        return throwError(() => error);
      }
      if ((authService.isTokenExpired || error.status == 401 || authService.isRefreshTokenExpiringSoon) && !openUrl) {
        return handle401Error(req, next, authService, sbService)
      }
      return throwError(() => error);
    })
  );
};



export function addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      [KEY_AUTHORIZATION]: `Bearer ${token}`
    }
  });
}

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, sbService: SnackbarService): Observable<HttpEvent<any>> {

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res: any) => {
        const token = res.data.token
        const expiresAt = res.data.expiresAt
        // const refreshToken = res.data.refreshToken

        authService.setAuthToken(token);
        authService.setExpireAt(expiresAt);

        isRefreshing = false;
        refreshTokenSubject.next(token);

        return next(addToken(request, token));
      }),
      catchError(err => {
        console.log(err)
        isRefreshing = false;
        refreshTokenSubject.next(null);
        sbService.openSnack('Session Expired');
        authService.logOut();
        return throwError(() => err);
      })
    );

  } else {
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token => next(addToken(request, token)))
    );
  }
}


