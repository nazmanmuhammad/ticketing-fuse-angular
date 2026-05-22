import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccessLevel } from './access-level.types';

@Injectable({ providedIn: 'root' })
export class AccessLevelService {
    private readonly _backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'http://127.0.0.1:9010/api';

    constructor(private _httpClient: HttpClient) {}

    getAccessLevels(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/access-levels`,
            { params: httpParams }
        );
    }

    getAccessLevel(id: string): Observable<any> {
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/access-levels/${id}`
        );
    }

    getAccessLevelsByRequestType(requestTypeId: string): Observable<any> {
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/access-levels/by-request-type/${requestTypeId}`
        );
    }

    createAccessLevel(data: Partial<AccessLevel>): Observable<any> {
        return this._httpClient.post<any>(
            `${this._backendApiUrl}/access-levels`,
            data
        );
    }

    updateAccessLevel(id: string, data: Partial<AccessLevel>): Observable<any> {
        return this._httpClient.put<any>(
            `${this._backendApiUrl}/access-levels/${id}`,
            data
        );
    }

    deleteAccessLevel(id: string): Observable<any> {
        return this._httpClient.delete<any>(
            `${this._backendApiUrl}/access-levels/${id}`
        );
    }

    exportAccessLevels(params?: any): Observable<Blob> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get(
            `${this._backendApiUrl}/access-levels/export`,
            { params: httpParams, responseType: 'blob' }
        );
    }
}
