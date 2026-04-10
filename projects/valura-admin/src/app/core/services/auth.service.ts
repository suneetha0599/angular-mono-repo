import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, firstValueFrom, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { IS_ADMIN, LSK_AUTH_TOKEN, LSK_CONFIG_VERSION, LSK_ENTITY_LIST, LSK_ENTRY_FEATURE_CODE, LSK_EXPIRES_AT, LSK_FLAT_FEATURE_LIST, LSK_IS_DOWNLOAD_LOADED, LSK_IS_LOGGED, LSK_PASSWORD_RESET_VIEW_TYPE, LSK_REFRESH_EXPIRES_AT, LSK_REFRESH_TOKEN, LSK_USER, LSK_USER_TYPE } from '../constants/local-storage-constants';
import { AUTH_REFRESH_TOKEN } from '../constants/api-constants';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { SidenavService } from '../services/sidenav.service';
import { FeatureService } from './feature.service';
import { DbService } from './db/db.service';
import { ADMIN_USER, EXTERNAL_USER, INTERNAL_USER, PLATFORM } from '../constants/constants';
import { routes } from '../constants/routes';
import { LoadingBarService } from '@valura-lib/service/loading-bar/loading-bar.service';
import { Feature } from '@admin-core/models/Feature';
import { ApiConfigService } from '../services/api-config.service';
import { EntityList } from '@admin-core/models/Entity';
import { RolePermissionService } from './permission/role-permission.service';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authUser = environment.authUser;
  public tokenUpdateSubject$: BehaviorSubject<string> = new BehaviorSubject('');
  private isAppReady$ = new BehaviorSubject<boolean>(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private sbService = inject(SnackbarService);
  private sidenavService = inject(SidenavService);
  private featureService = inject(FeatureService);
  private apiConfigService = inject(ApiConfigService);
  private dbService = inject(DbService);
  private requestId: string = '';
  private progressService = inject(LoadingBarService);
  private rolePermissionService = inject(RolePermissionService);

  constructor() { }
  setAppReady(status: boolean) {
    this.isAppReady$.next(status);
  }

  waitUntilReady(): Promise<boolean> {
    return firstValueFrom(
      this.isAppReady$.asObservable().pipe(filter(ready => ready === true))
    );
  }
  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  getRequestId(): string {
    return this.requestId;
  }

  externalLogin(res: any) {
    const queryParams = this.getEntryCode();
    this.clearStorage();
    const accessToken = res.data.accessToken.token
    const refreshToken = res.data.refreshToken.token
    const expiresAt = res.data.accessToken.expiresAt
    const refreshExpiresAt = res.data.refreshToken.expiresAt
    const userData = { ...res.data.user, userType: EXTERNAL_USER };
    const configurationVersion = res.configurationVersion;
    const featureList = res.data.features
    const entityList = res.data.entities
    const apiEndpoint = res.data.apiEndpoint

    this.apiConfigService.setApiEndPoint(apiEndpoint);
    this.setAuthToken(accessToken);
    this.setRefreshToken(refreshToken);
    this.setExpireAt(expiresAt)
    this.setRefreshTokenExpireAt(refreshExpiresAt)
    this.setUserInfo(userData);
    this.rolePermissionService.setUserPermisson(userData.permissions);
    this.setFeatureList(featureList)
    this.setConfigVersion(configurationVersion)
    this.setEntityList(entityList)
    this.setIsLoggedValue()
    this.setUserType(EXTERNAL_USER);
    this.setEntryCode(queryParams)
    // this.goToDashboard();
    this.postUserLogin(res, queryParams);
  }

  internalLogin(res: any) {
    const queryParams = this.getEntryCode();
    this.clearStorage();
    const accessToken = res.data.accessToken.token
    const refreshToken = res.data.refreshToken.token
    const expiresAt = res.data.accessToken.expiresAt
    const refreshExpiresAt = res.data.refreshToken.expiresAt
    const userData = { ...res.data.user, userType: INTERNAL_USER };
    const configurationVersion = res.configurationVersion;
    const featureList = res.data.features
    const entityList = res.data.entities
    const apiEndpoint = res.data.apiEndpoint

    this.apiConfigService.setApiEndPoint(apiEndpoint);
    this.setAuthToken(accessToken);
    this.setRefreshToken(refreshToken);
    this.setExpireAt(expiresAt)
    this.setRefreshTokenExpireAt(refreshExpiresAt)
    this.setUserInfo(userData);
    this.rolePermissionService.setUserPermisson(userData.permissions);
    this.setFeatureList(featureList)
    this.setConfigVersion(configurationVersion)
    this.setEntityList(entityList)
    this.setIsLoggedValue()
    this.setUserType(INTERNAL_USER);
    this.setEntryCode(queryParams)

    // this.goToDashboard();
    this.postUserLogin(res, queryParams);
  }

  async doLogin(res: any) {
    const queryParams = this.getEntryCode();
    const viewType = this.getViewType();
    this.clearStorage();

    const accessToken = res.data.accessToken.token
    const refreshToken = res.data.refreshToken.token
    const expiresAt = res.data.accessToken.expiresAt
    const refreshExpiresAt = res.data.refreshToken.expiresAt
    const userData = { ...res.data.user, userType: ADMIN_USER };
    const configurationVersion = res.configurationVersion;
    const featureList = res.data.features
    const entityList = res.data.entities
    const apiEndpoint = res.data.apiEndpoint

    this.apiConfigService.setApiEndPoint(apiEndpoint);
    this.setAuthToken(accessToken);
    this.setRefreshToken(refreshToken);
    this.setExpireAt(expiresAt)
    this.setRefreshTokenExpireAt(refreshExpiresAt)
    this.setUserInfo(userData);
    this.rolePermissionService.setUserPermisson(userData.permissions);
    this.setFeatureList(featureList)
    this.setEntryCode(queryParams)
    this.setUserType(ADMIN_USER);
    // this.setDownloadLoaded();
    this.setConfigVersion(configurationVersion)
    this.setEntityList(entityList)
    if (viewType) {
      this.setViewType(viewType);
    }
    await this.navigateBasedOnContext(res, queryParams);
  }

  async navigateBasedOnContext(res: any, queryParams: any = null) {
    if (res.data.forgotPasswordInitiated || res.data.passwordChangeRequired) {
      const _queryParams = res?.setPasswordNavigationType ? { type: res.setPasswordNavigationType } : null;
      this.router.navigate([routes.RESET_PASSWORD], { replaceUrl: true, queryParams: _queryParams });
    }
    else if (res.data?.inviteUserSuccess) {
      this.router.navigate([routes.LOGIN], { replaceUrl: true });
    }
    else {
      if (this.isAuthUser) {
        this.postAdminLogin(res);
      }
      else {
        this.postUserLogin(res, queryParams);
      }
    }
  }

  postUserLogin(res: any, queryParams: any) {
    this.setDownloadLoaded();
    this.goToConfigurationDownload();
  }

  setUserType(userType: string) {
    setItem(LSK_USER_TYPE, userType);
  }

  getUserType(): string {
    return getItem(LSK_USER_TYPE) || '';
  }

  get isExternalUser(): boolean {
    return this.getUserType() === EXTERNAL_USER;
  }

  get isInternalUser(): boolean {
    return this.getUserType() === INTERNAL_USER
  }

  get isAuthUser(): boolean {
    return this.authUser
  }

  get isAdminUser(): boolean {
    return this.getUserType() === ADMIN_USER
  }

  async goToDashboard() {
    this.setAppReady(false);
    await this.featureService.getFeatureList(true)
    const queryParams = this.getEntryCode();
    const entryPage = await this.featureService.getEntryPage(true, queryParams)
    if (entryPage) {
      const params = {
        ...(entryPage?.key ? { key: entryPage.key, ...entryPage.extraParams } : {}),
        ...(entryPage?.queryParams || {})
      };
      this.sidenavService.setPageTittle(entryPage.featureName)
      this.router.navigate([entryPage.featureRoute], { replaceUrl: true, queryParams: Object.keys(params).length ? params : null });
      this.setEntryCode(null);
      this.setAppReady(true);
    }
    else {
      this.sbService.openSnack("You do not have access to any route")
      this.logOut()
    }
  }

  /**
   * Logout function
   */
  async logOut(): Promise<void> {
    let internalUser = this.isInternalUser;
    let externalUser = this.isExternalUser;
    this.clearStorage();
    await this.dbService.deleteDatabase()
    if (internalUser || externalUser) {
      this.progressService.onRequestsComplete();
      this.rolePermissionService.clearData();
      if (internalUser) {
        this.router.navigate([routes.INTERNAL_LOGIN])
      }
      else if (externalUser) {
        this.router.navigate([routes.EXTERNAL_LOGIN])
      }
    }
    else {
      location.reload();
    }
  }

  setAuthToken(token: string) {
    setItem(LSK_AUTH_TOKEN, token);
    this.tokenUpdateSubject$.next(token)
  }

  setEntityList(entityList: EntityList[]) {
    setItem(LSK_ENTITY_LIST, entityList)
  }


  getEntityList(): EntityList[] | null {
    return getItem(LSK_ENTITY_LIST)
  }

  setRefreshToken(token: string) {
    setItem(LSK_REFRESH_TOKEN, token)
  }

  setExpireAt(expiredAt: string) {
    setItem(LSK_EXPIRES_AT, expiredAt)
  }

  setRefreshTokenExpireAt(expiredAt: string) {
    setItem(LSK_REFRESH_EXPIRES_AT, expiredAt)
  }
  /**
   * Get token from storage
   */

  getAuthToken(): string {
    return getItem(LSK_AUTH_TOKEN) ?? ''
  }


  getRefreshToken(): string | null {
    return getItem(LSK_REFRESH_TOKEN)
  }

  setIsAdmin(isAdmin: string) {
    return setItem(IS_ADMIN, isAdmin)
  }

  getIsAdmin() {
    return getItem(IS_ADMIN)
  }

  setIsLoggedValue() {
    setItem(LSK_IS_LOGGED, 'true')
  }

  setDownloadLoaded() {
    setItem(LSK_IS_DOWNLOAD_LOADED, 'true')
  }
  /**
    * Check if user is logged in
    */
  isLoggedIn() {
    return !!getItem(LSK_IS_LOGGED);
  }

  isDownloadLoaded() {
    return !!getItem(LSK_IS_DOWNLOAD_LOADED);
  }

  getExpireAt(): string | null {
    return getItem(LSK_EXPIRES_AT)
  }

  getResfrehExpireAt(): string | null {
    return getItem(LSK_REFRESH_EXPIRES_AT)
  }


  //Fetch refresh token
  refreshToken() {
    const body: any = {
      refreshToken: this.getRefreshToken()
    }
    return this.http.get(
      `${this.apiConfigService.defaultServerUrl}${AUTH_REFRESH_TOKEN}`,
      { params: body }
    ).pipe(
      tap((data: any) => {
        return data
      }),
      catchError((error: any) => {
        return throwError(() => new Error(error));
      })
    );
  }


  clearStorage() {
    localStorage.clear();
  }


  /**
   * Get the currently logged in user
   */

  setUserInfo(data: User,) {
    setItem(LSK_USER, data);
  }

  getUserInfo(): User | null {
    return getItem(LSK_USER)
  }

  setConfigVersion(version: string,) {
    setItem(LSK_CONFIG_VERSION, version);
  }

  getConfigVersion(): string | null {
    return getItem(LSK_CONFIG_VERSION)
  }

  setFeatureList(res: Feature) {
    setItem(LSK_FLAT_FEATURE_LIST, res ?? [])
  }

  get isTokenExpired(): boolean {
    const expiresAt = +(this.getExpireAt() ?? 0)
    const now = Math.floor(Date.now() / 1000);
    return now >= expiresAt;
  }

  get isRefreshTokenExpired(): boolean {
    const expiresAt = +(this.getResfrehExpireAt() ?? 0)
    const now = Math.floor(Date.now() / 1000);
    return now >= expiresAt;
  }

  get isRefreshTokenExpiringSoon(): boolean {
    const expiresAt = +(this.getResfrehExpireAt() ?? 0)
    const now = Math.floor(Date.now() / 1000);
    const earlyExpiryThreshold = expiresAt - 180; // 3 minutes early
    return now >= earlyExpiryThreshold;
  }

  setEntryCode(data: any) {
    setItem(LSK_ENTRY_FEATURE_CODE, data);
  }

  getEntryCode(): any | null {
    return getItem(LSK_ENTRY_FEATURE_CODE)
  }

  setViewType(data: any) {
    setItem(LSK_PASSWORD_RESET_VIEW_TYPE, data);
  }

  getViewType() {
    return getItem(LSK_PASSWORD_RESET_VIEW_TYPE);
  }

  removeViewType() {
    return removeItem(LSK_PASSWORD_RESET_VIEW_TYPE);
  }

  goToConfigurationDownload() {
    this.router.navigate([routes.DOWNLOAD_LAYOUT], { replaceUrl: true });
  }

  postConfigurationDownload() {
    this.setIsLoggedValue();
    this.goToDashboard()
  }

  async postAdminLogin(res: any) {
    this.setIsLoggedValue();
    await this.goToDashboard();
  }

  doAuthLogin(res: any) {
    const queryParams = this.getEntryCode();
    this.clearStorage();
    const accessToken = res.data.accessToken.token
    const refreshToken = res.data.refreshToken.token
    const expiresAt = res.data.accessToken.expiresAt
    const refreshExpiresAt = res.data.refreshToken.expiresAt
    const userData = res.data.user
    const featureList = res.data.features;
    const entities = res.data.entities
    const apiEndpoint = res.data.apiEndpoint

    this.setAuthToken(accessToken);
    this.setRefreshToken(refreshToken);
    this.setExpireAt(expiresAt)
    this.setRefreshTokenExpireAt(refreshExpiresAt)
    this.setFeatureList(featureList)
    this.setEntityList(entities);
    this.apiConfigService.setApiEndPoint(apiEndpoint);
    if (userData) {
      this.setUserInfo(userData);
      this.rolePermissionService.setUserPermisson(userData.permissions);
    }

    // this.setIsLoggedValue()
    this.setUserType(ADMIN_USER);
    this.setEntryCode(queryParams)
    this.navigateBasedOnContext(res, queryParams);
  }

  get platform(): string {
    return this.isAuthUser ? PLATFORM.CENTRAL_AUTH : PLATFORM.CORE
  }

  clearAuthData() {
    this.apiConfigService.clearApiEndPoint();
    removeItem(LSK_AUTH_TOKEN);
    removeItem(LSK_REFRESH_TOKEN);
  }
}
