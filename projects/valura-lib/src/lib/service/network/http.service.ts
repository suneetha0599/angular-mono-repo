import { inject, Injectable, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, finalize, map, tap, throwError } from 'rxjs';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiResponse } from '../../models/network/ApiResponse';
import { HttpPost } from '../../models/network/HttpPost';
import { HTTP_STATUS_SUCCESS, KEY_NO_AUTH, OPEN_URL_LIST, STATUS_FAILED, STATUS_SUCCESS } from '../../constants/api-constants';
import { LoadingBarService } from '@valura-lib/service/loading-bar/loading-bar.service';
import { AuthService } from '../auth.service';
import { ApiConfigService } from '../api-config.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  private http = inject(HttpClient);
  private sbService = inject(SnackbarService);
  private loadingBarService = inject(LoadingBarService);
  private apiConfigService = inject(ApiConfigService);

  constructor(private injector: Injector) { }

  private onHttpSuccess(res: ApiResponse, showSnackBar: boolean, showSnackBarOnError: boolean) {
    if (showSnackBar && res.showSuccesSnackBar) {
      this.sbService.openSnack(res.message)
    }

    if (showSnackBarOnError && res.showErrorSnackbar) {
      this.sbService.openSnack(res.message)
    }
  }

  httpGet(queryUrl: string, params: any = null, showSnackBar = false, showSnackBarOnError = true, defaultServerUrl = false) {
    const serverUrl = defaultServerUrl ? `${this.apiConfigService.defaultServerUrl}` : `${this.apiConfigService.serverUrl}`;
    const url = `${serverUrl}${queryUrl}`;
    this.loadingBarService.onRequestStart();
    return this.http.get(
      url,
      { params: params }
    ).pipe(
      map((res: any) => new ApiResponse(res)),
      tap((res: ApiResponse) => {
        this.onHttpSuccess(res, showSnackBar, showSnackBarOnError)
        return res
      }),
      catchError((error) => this.handleError(error, showSnackBarOnError)),
      finalize(() => {
        this.loadingBarService.onRequestComplete();
      })
    )
  }

  httpPost({ queryUrl, params = null, body = null, showSnackBar = false, showSnackBarOnError = true, defaultServerUrl = false }: HttpPost) {
    const serverUrl = defaultServerUrl ? `${this.apiConfigService.defaultServerUrl}` : `${this.apiConfigService.serverUrl}`;
    const url = `${serverUrl}${queryUrl}`;
    this.loadingBarService.onRequestStart()
    return this.http.post(
      url,
      body,
      {
        params: params,
      }
    ).pipe(
      map((res: any) => new ApiResponse(res)),
      tap((res: ApiResponse) => {
        this.onHttpSuccess(res, showSnackBar, showSnackBarOnError)
        return res
      }),
      catchError((error) => this.handleError(error, showSnackBarOnError)),
      finalize(() => {
        this.loadingBarService.onRequestComplete();
      })
    )
  }


  httpDelete(queryUrl: string, params: any = null, body: any = null, showSnackBar = false, showSnackBarOnError = true) {
    const url = `${this.apiConfigService.serverUrl}${queryUrl}`;
    this.loadingBarService.onRequestStart();

    return this.http.delete(url, { body, params }).pipe(
      map((res: any) => new ApiResponse(res)),
      tap((res: ApiResponse) => {
        this.onHttpSuccess(res, showSnackBar, showSnackBarOnError)
        return res;
      }),
      catchError((error) => this.handleError(error, showSnackBarOnError)),
      finalize(() => {
        this.loadingBarService.onRequestComplete();
      })
    );
  }


  private handleCustomError(res: any) {
    if (!res) return null;

    if (res.error && typeof res.error === 'object') {
      const keys = Object.keys(res.error);
      if (keys.length > 0) {
        return res.error[keys[0]];
      }
    }
    if (res.message) {
      return res.message;
    }

    return null
  }


  httpFileUpload({ queryUrl, file, showSnackBar = false, showSnackBarOnError = true }: HttpPost) {
    const formData: FormData = new FormData();
    formData.append("file", file);

    const url = `${this.apiConfigService.serverUrl}${queryUrl}`;

    const options: any = {
      params: null
    };

    return this.http.post(url, formData, options).pipe(
      map((res: any) => new ApiResponse(res)),
      tap((res: ApiResponse) => {
        this.onHttpSuccess(res, showSnackBar, showSnackBarOnError)
        return res
      }),
      catchError((error) => this.handleError(error, showSnackBarOnError)),
    )
  }

  httpGetFile({ queryUrl, params = null, body = null, showSnackBar = false, showSnackBarOnError = true }: HttpPost) {
    const url = `${this.apiConfigService.serverUrl}${queryUrl}`;

    const options = {
      params,
      observe: 'response' as 'response',
      responseType: 'blob' as 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    return this.http.post(url, body, options,).pipe(
      map((res: any) => res),
      tap((res: any) => {
        this.onHttpSuccess(res, showSnackBar, showSnackBarOnError)
        return res
      }),
      catchError((error) => this.handleError(error, showSnackBarOnError)),
    )
  }

  httpRequestWithHeader({ queryUrl, params = null, body = null, showSnackBar = false, showSnackBarOnError = true }: HttpPost) {

    const _body = JSON.stringify(body);
    const url = `${this.apiConfigService.serverUrl}${queryUrl}`;
    const options = {
      params,
      observe: 'response' as 'response',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    return this.http.post(url, _body, options)
      .pipe(
        tap((response) => {
          return response;
        }),
        catchError((error: any) => {
          console.log(error)
          if (error && error.error && error.error.success === STATUS_FAILED && error.error.message) {
            if (showSnackBarOnError) {
              this.sbService.openSnack(error.error.message)
            }
            return throwError(() => new Error(error));
          }
          this.sbService.openSnack('There was error processing request!!')
          return throwError(() => new Error(error));
        }),
      );
  }

  httpPutRequestWithHeader({ queryUrl, file, params = null, showSnackBar = false, showSnackBarOnError = true }: HttpPost) {
    const url = `${queryUrl}`;

    let headerConfig: any = {
      "Content-Type": file.type,
      [KEY_NO_AUTH]: 'true'
    };

    // Check if x-amz-acl is in SignedHeaders
    try {
      const urlObj = new URL(url);
      const signedHeaders = urlObj.searchParams.get('X-Amz-SignedHeaders');

      if (signedHeaders && signedHeaders.includes('x-amz-acl')) {
        // x-amz-acl is required in the request headers
        // Try to get the value from query params, otherwise use default 'public-read'
        const aclValue = urlObj.searchParams.get('x-amz-acl') || 'public-read';
        headerConfig['x-amz-acl'] = aclValue;
      }
    } catch (e) {
      console.warn('[HTTP] Failed to parse URL:', e);
    }

    const headers = new HttpHeaders(headerConfig);
    const options = {
      params,
      observe: 'response' as 'response',
      headers: headers
    };

    return this.http.put(url, file, options).pipe(
      tap((response) => {
        return response;
      }),
      catchError((error: any) => {
        console.log(error)
        if (error && error.error && error.error.status === STATUS_FAILED && error.error.message) {
          if (showSnackBarOnError) {
            this.sbService.openSnack(error.error.message)
          }
          return throwError(() => new Error(error));
        }
        if (showSnackBarOnError) {
          this.sbService.openSnack('There was error processing request!!')
        }
        return throwError(() => new Error(error));
      }),
    );
  }

  httpPatch({ queryUrl, params = null, body = null, showSnackBar = false, showSnackBarOnError = true }: HttpPost) {
    const url = `${this.apiConfigService.serverUrl}${queryUrl}`;
    this.loadingBarService.onRequestStart();
    const options = {
      params,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    return this.http.patch(
      url,
      body,
      { params: params }
    ).pipe(
      map((res: any) => new ApiResponse(res)),
      tap((res: ApiResponse) => {
        this.onHttpSuccess(res, showSnackBar, showSnackBarOnError);
        return res;
      }),
      catchError((error) => this.handleError(error, showSnackBarOnError)),
      finalize(() => {
        this.loadingBarService.onRequestComplete();
      })
    );
  }


  private handleError = (error: HttpErrorResponse, showSnackBarOnError: boolean = true) => {
    let errorMessage = ''
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
      errorMessage = "Network Error"
    } else {
      if (showSnackBarOnError) {
        const authService = this.injector.get(AuthService);
        const urlWithoutParams = error?.url ? error.url.split('?')[0] : ''; // to fetch only query url without params
        const reqUrl = urlWithoutParams ? urlWithoutParams.replace(this.apiConfigService.serverUrl, '') : null;
        const hideErrorMsg = reqUrl ? (OPEN_URL_LIST.includes(`${reqUrl}`) ? true : false) : false

        if ((authService.isTokenExpired || authService.isRefreshTokenExpired) && !hideErrorMsg) {

          errorMessage = 'Session expired'
        }
        else {
          errorMessage = this.handleCustomError(error.error)
        }

        if (!errorMessage) {
          errorMessage = `Something went wrong ${error.status ? `Error code : ${error.status}` : ''}`
        }
      }
    }
    if (!errorMessage) {
      errorMessage = 'Something went wrong; Please try again later.'
    }
    if (!showSnackBarOnError) {
      errorMessage = ''
    }
    if (errorMessage) {
      this.sbService.openSnack(errorMessage)
    }
    return throwError(() => new Error(errorMessage));
  }

  isSuccess(status: boolean) {
    return status == STATUS_SUCCESS ? true : false
  }

  isHttpSuccess(status: number) {
    return status == HTTP_STATUS_SUCCESS ? true : false
  }

  httpPut({ queryUrl,
    params = null,
    body = null,
    showSnackBar = false,
    showSnackBarOnError = true,
    showLoadingBar = true,
    defaultServerUrl = false
  }: HttpPost) {
    const serverUrl = defaultServerUrl ? `${this.apiConfigService.defaultServerUrl}` : `${this.apiConfigService.serverUrl}`;
    const url = `${serverUrl}${queryUrl}`;
    if (showLoadingBar) {
      this.loadingBarService.onRequestStart();
    }

    const options = {
      params,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    return this.http.put(url, body, options).pipe(
      map((res: any) => new ApiResponse(res)),
      tap((res: ApiResponse) => {
        this.onHttpSuccess(res, showSnackBar, showSnackBarOnError);
        return res;
      }),
      catchError((error) => this.handleError(error, showSnackBarOnError)),
      finalize(() => {
        if (showLoadingBar) {
          this.loadingBarService.onRequestComplete();
        }
      })
    );
  }

}
