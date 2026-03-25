import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _apiUrl: string =
        (globalThis as any)?.__env?.HRIS_API_URL ||
        (globalThis as any)?.process?.env?.HRIS_API_URL ||
        (globalThis as any)?.HRIS_API_URL ||
        'https://back.siglab.co.id';
    private _backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'http://127.0.0.1:9010/api';

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        const body = new HttpParams()
            .set('email', credentials.email)
            .set('password', credentials.password);

        return this._validateLogin(credentials).pipe(
            switchMap((isValid: boolean) => {
                if (!isValid) {
                    return throwError('Akun tidak terdaftar.');
                }

                return this._httpClient.post(
                    this._buildUrl('/auth/login'),
                    body.toString(),
                    {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/x-www-form-urlencoded',
                        }),
                    }
                );
            }),
            switchMap((response: any) => {
                const token = this._extractToken(response);
                if (token) {
                    this.accessToken = token;
                }

                this._authenticated = true;

                return this._meRequest().pipe(
                    map((user: User) => {
                        this._userService.user = user;
                        return { ...response, user };
                    })
                );
            })
        );
    }

    private _buildUrl(path: string): string {
        return `${this._apiUrl.replace(/\/$/, '')}${path}`;
    }

    private _buildLoginValidationUrl(): string {
        if (!this._backendApiUrl) {
            return '/login-validation';
        }

        const normalizedBaseUrl = this._backendApiUrl.replace(/\/$/, '');
        if (normalizedBaseUrl.endsWith('/login-validation')) {
            return normalizedBaseUrl;
        }

        return `${normalizedBaseUrl}/login-validation`;
    }

    private _buildMeValidationUrl(): string {
        if (!this._backendApiUrl) {
            return '/me-validation';
        }

        const normalizedBaseUrl = this._backendApiUrl.replace(/\/$/, '');
        if (normalizedBaseUrl.endsWith('/me-validation')) {
            return normalizedBaseUrl;
        }

        return `${normalizedBaseUrl}/me-validation`;
    }

    private _validateLogin(credentials: {
        email: string;
        password: string;
    }): Observable<boolean> {
        return this._httpClient
            .post(this._buildLoginValidationUrl(), {
                email: credentials.email,
                password: credentials.password,
            })
            .pipe(
                map((response: any) => this._isLoginValidationPassed(response)),
                catchError(() => throwError('Akun tidak terdaftar.'))
            );
    }

    private _isLoginValidationPassed(response: any): boolean {
        if (typeof response === 'boolean') {
            return response;
        }

        if (response === null || response === undefined) {
            return false;
        }

        if (Array.isArray(response)) {
            return response.length > 0;
        }

        if (typeof response !== 'object') {
            return Boolean(response);
        }

        if (response.hasOwnProperty('valid')) {
            return Boolean(response.valid);
        }

        if (response.hasOwnProperty('is_valid')) {
            return Boolean(response.is_valid);
        }

        if (response.hasOwnProperty('allowed')) {
            return Boolean(response.allowed);
        }

        if (response.hasOwnProperty('exists')) {
            return Boolean(response.exists);
        }

        if (response.hasOwnProperty('registered')) {
            return Boolean(response.registered);
        }

        if (response.hasOwnProperty('success')) {
            return Boolean(response.success);
        }

        if (response.hasOwnProperty('data')) {
            return this._isLoginValidationPassed(response.data);
        }

        if (response.hasOwnProperty('user')) {
            return this._isLoginValidationPassed(response.user);
        }

        return Object.keys(response).length > 0;
    }

    private _extractToken(response: any): string {
        return (
            response?.accessToken ||
            response?.access_token ||
            response?.token ||
            response?.data?.accessToken ||
            response?.data?.access_token ||
            response?.data?.token ||
            ''
        );
    }

    private _extractMeData(meResponse: any): any {
        return Array.isArray(meResponse) ? meResponse[0] : meResponse;
    }

    private _extractHrisUserId(meResponse: any): string {
        const meData = this._extractMeData(meResponse);
        return String(
            meData?.user_id ?? meData?.employee_id ?? meData?.id ?? ''
        );
    }

    private _mapMeResponseToUser(meResponse: any, meValidationResponse: any): User {
        const meData = this._extractMeData(meResponse);
        const appUser =
            meValidationResponse?.user ??
            meValidationResponse?.data?.user ??
            meValidationResponse?.data ??
            null;

        return {
            id: String(
                appUser?.id ??
                    meData?.user_id ??
                    meData?.employee_id ??
                    meData?.id ??
                    ''
            ),
            name: meData?.employee_name ?? meData?.name ?? meData?.nik ?? '',
            email:
                appUser?.email ??
                meData?.email ??
                meData?.nik ??
                meData?.noktp ??
                '',
            photo: meData?.photo ?? meData?.avatar ?? '',
            avatar: meData?.avatar ?? '',
            status: appUser?.status ? 'online' : 'not-visible',
            role_name: appUser?.role_name ?? appUser?.roleName ?? '',
            hris_user_id:
                appUser?.hris_user_id ??
                appUser?.hrisUserId ??
                Number(this._extractHrisUserId(meResponse)),
            department_id: appUser?.department_id ?? appUser?.departmentId ?? '',
        };
    }

    private _meValidationRequest(meResponse: any): Observable<any> {
        const meData = this._extractMeData(meResponse);
        let params = new HttpParams();
        const hrisUserId = this._extractHrisUserId(meResponse);
        if (hrisUserId) {
            params = params.set('hris_user_id', hrisUserId);
        }
        const email = meData?.email;
        if (email) {
            params = params.set('email', email);
        }

        return this._httpClient
            .get(this._buildMeValidationUrl(), { params })
            .pipe(
                switchMap((response: any) => {
                    if (!this._isLoginValidationPassed(response)) {
                        return throwError('Akun tidak terdaftar di aplikasi.');
                    }

                    return of(response);
                }),
                catchError(() =>
                    throwError('Akun tidak terdaftar di aplikasi.')
                )
            );
    }

    private _meRequest(): Observable<User> {
        return this._httpClient.get(this._buildUrl('/me')).pipe(
            switchMap((meResponse: any) =>
                this._meValidationRequest(meResponse).pipe(
                    map((meValidationResponse: any) =>
                        this._mapMeResponseToUser(meResponse, meValidationResponse)
                    )
                )
            )
        );
    }

    signInUsingToken(): Observable<any> {
        return this._meRequest().pipe(
            catchError(() => of(false)),
            switchMap((user: User | false) => {
                if (!user) {
                    return of(false);
                }

                this._authenticated = true;
                this._userService.user = user;

                return of(true);
            })
        );
    }

    signOut(): Observable<any> {
        localStorage.removeItem('accessToken');
        this._authenticated = false;
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        name: string;
        email: string;
        password: string;
        company: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Request access
     *
     * @param user
     */
    requestAccess(user: {
        name: string;
        email: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/request-access', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        if (this._authenticated) {
            return of(true);
        }

        if (!this.accessToken) {
            return of(false);
        }

        return this.signInUsingToken();
    }
}
