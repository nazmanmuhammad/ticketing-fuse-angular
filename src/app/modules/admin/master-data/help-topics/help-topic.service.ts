import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HelpTopic } from './help-topic.types';

@Injectable({ providedIn: 'root' })
export class HelpTopicService {
    private readonly _backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL;

    constructor(private _httpClient: HttpClient) {}

    getHelpTopics(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/help-topics`,
            { params: httpParams }
        );
    }

    getHelpTopic(id: string): Observable<any> {
        return this._httpClient.get<any>(
            `${this._backendApiUrl}/help-topics/${id}`
        );
    }

    createHelpTopic(data: Partial<HelpTopic>): Observable<any> {
        return this._httpClient.post<any>(
            `${this._backendApiUrl}/help-topics`,
            data
        );
    }

    updateHelpTopic(id: string, data: Partial<HelpTopic>): Observable<any> {
        return this._httpClient.put<any>(
            `${this._backendApiUrl}/help-topics/${id}`,
            data
        );
    }

    deleteHelpTopic(id: string): Observable<any> {
        return this._httpClient.delete<any>(
            `${this._backendApiUrl}/help-topics/${id}`
        );
    }

    exportHelpTopics(params?: any): Observable<Blob> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this._httpClient.get(
            `${this._backendApiUrl}/help-topics/export`,
            { params: httpParams, responseType: 'blob' }
        );
    }
}
