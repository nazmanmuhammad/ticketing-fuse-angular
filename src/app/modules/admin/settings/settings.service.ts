import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

export interface ApplicationSettingPayload {
    app_name: string;
    app_title: string;
    logo_url: string;
    favicon_url: string;
}

export interface SmtpSettingPayload {
    host: string;
    port: number | null;
    encryption: 'none' | 'ssl' | 'tls';
    username: string;
    password: string;
    from_name: string;
    from_email: string;
}

export interface WhatsappSettingPayload {
    url: string;
    key: string;
    footer: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
    private readonly _backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'http://127.0.0.1:9010/api';

    constructor(private _httpClient: HttpClient) {}

    getApplicationSetting(): Observable<ApplicationSettingPayload> {
        return this._httpClient
            .get<ApiResponse<ApplicationSettingPayload>>(this._buildUrl('application'))
            .pipe(
                map((response) => ({
                    app_name: response?.data?.app_name || '',
                    app_title: response?.data?.app_title || '',
                    logo_url: this._resolveAssetUrl(response?.data?.logo_url || ''),
                    favicon_url: this._resolveAssetUrl(response?.data?.favicon_url || ''),
                }))
            );
    }

    updateApplicationSetting(payload: {
        app_name: string;
        app_title: string;
        logo_url: string;
        favicon_url: string;
        logo_file?: File | null;
        favicon_file?: File | null;
    }): Observable<ApplicationSettingPayload> {
        const formData = new FormData();
        formData.append('app_name', payload.app_name || '');
        formData.append('app_title', payload.app_title || '');
        formData.append('logo_url', payload.logo_url || '');
        formData.append('favicon_url', payload.favicon_url || '');

        if (payload.logo_file) {
            formData.append('logo_file', payload.logo_file);
        }

        if (payload.favicon_file) {
            formData.append('favicon_file', payload.favicon_file);
        }

        return this._httpClient
            .post<ApiResponse<ApplicationSettingPayload>>(
                this._buildUrl('application'),
                formData
            )
            .pipe(
                map((response) => ({
                    app_name: response?.data?.app_name || '',
                    app_title: response?.data?.app_title || '',
                    logo_url: this._resolveAssetUrl(response?.data?.logo_url || ''),
                    favicon_url: this._resolveAssetUrl(response?.data?.favicon_url || ''),
                }))
            );
    }

    getSmtpSetting(): Observable<SmtpSettingPayload> {
        return this._httpClient
            .get<ApiResponse<SmtpSettingPayload>>(this._buildUrl('smtp'))
            .pipe(
                map((response) => ({
                    host: response?.data?.host || '',
                    port: Number(response?.data?.port ?? 587) || 587,
                    encryption:
                        (response?.data?.encryption as 'none' | 'ssl' | 'tls') || 'tls',
                    username: response?.data?.username || '',
                    password: response?.data?.password || '',
                    from_name: response?.data?.from_name || '',
                    from_email: response?.data?.from_email || '',
                }))
            );
    }

    updateSmtpSetting(payload: SmtpSettingPayload): Observable<SmtpSettingPayload> {
        return this._httpClient
            .post<ApiResponse<SmtpSettingPayload>>(this._buildUrl('smtp'), payload)
            .pipe(
                map((response) => ({
                    host: response?.data?.host || '',
                    port: Number(response?.data?.port ?? 587) || 587,
                    encryption:
                        (response?.data?.encryption as 'none' | 'ssl' | 'tls') || 'tls',
                    username: response?.data?.username || '',
                    password: response?.data?.password || '',
                    from_name: response?.data?.from_name || '',
                    from_email: response?.data?.from_email || '',
                }))
            );
    }

    getWhatsappSetting(): Observable<WhatsappSettingPayload> {
        return this._httpClient
            .get<ApiResponse<WhatsappSettingPayload>>(this._buildUrl('whatsapp'))
            .pipe(
                map((response) => ({
                    url: response?.data?.url || '',
                    key: response?.data?.key || '',
                    footer: response?.data?.footer || '',
                }))
            );
    }

    updateWhatsappSetting(payload: WhatsappSettingPayload): Observable<WhatsappSettingPayload> {
        return this._httpClient
            .post<ApiResponse<WhatsappSettingPayload>>(this._buildUrl('whatsapp'), payload)
            .pipe(
                map((response) => ({
                    url: response?.data?.url || '',
                    key: response?.data?.key || '',
                    footer: response?.data?.footer || '',
                }))
            );
    }

    private _buildUrl(path: 'application' | 'smtp' | 'whatsapp'): string {
        return `${this._backendApiUrl.replace(/\/$/, '')}/settings/${path}`;
    }

    private _resolveAssetUrl(url: string): string {
        if (!url) {
            return '';
        }

        if (/^https?:\/\//i.test(url)) {
            return url;
        }

        const backendOrigin = this._backendApiUrl
            .replace(/\/$/, '')
            .replace(/\/api$/, '');

        return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
}
