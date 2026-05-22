import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketSource } from './ticket-source.types';

@Injectable({ providedIn: 'root' })
export class TicketSourceService {
    private readonly _backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'https://ticket-api.siglab.site/api';

    constructor(private _httpClient: HttpClient) {}

    getTicketSources(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/ticket-sources`,
            { params: httpParams }
        );
    }

    getTicketSource(id: string): Observable<any> {
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/ticket-sources/${id}`
        );
    }

    createTicketSource(data: Partial<TicketSource>): Observable<any> {
        return this._httpClient.post<any>(
            `${this._backendApiUrl}/ticket-sources`,
            data
        );
    }

    updateTicketSource(id: string, data: Partial<TicketSource>): Observable<any> {
        return this._httpClient.put<any>(
            `${this._backendApiUrl}/ticket-sources/${id}`,
            data
        );
    }

    deleteTicketSource(id: string): Observable<any> {
        return this._httpClient.delete<any>(
            `${this._backendApiUrl}/ticket-sources/${id}`
        );
    }

    exportTicketSources(params?: any): Observable<Blob> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get(
            `${this._backendApiUrl}/ticket-sources/export`,
            { params: httpParams, responseType: 'blob' }
        );
    }
}
