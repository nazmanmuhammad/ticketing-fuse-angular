import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestType } from './request-type.types';

@Injectable({ providedIn: 'root' })
export class RequestTypeService {
    private readonly _backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'https://ticket-api.siglab.site/api';

    constructor(private _httpClient: HttpClient) {}

    getRequestTypes(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/request-types`,
            { params: httpParams }
        );
    }

    getRequestType(id: string): Observable<any> {
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/request-types/${id}`
        );
    }

    createRequestType(data: Partial<RequestType>): Observable<any> {
        return this._httpClient.post<any>(
            `${this._backendApiUrl}/request-types`,
            data
        );
    }

    updateRequestType(id: string, data: Partial<RequestType>): Observable<any> {
        return this._httpClient.put<any>(
            `${this._backendApiUrl}/request-types/${id}`,
            data
        );
    }

    deleteRequestType(id: string): Observable<any> {
        return this._httpClient.delete<any>(
            `${this._backendApiUrl}/request-types/${id}`
        );
    }

    exportRequestTypes(params?: any): Observable<Blob> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get(
            `${this._backendApiUrl}/request-types/export`,
            { params: httpParams, responseType: 'blob' }
        );
    }
}
