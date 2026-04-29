import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AccessRequest {
    id: string;
    request_number: string;
    requester_id: string;
    full_name: string;
    email: string;
    phone?: string;
    department: string;
    resource_name: string;
    request_type: 'New Access' | 'Change Access' | 'Revoke Access';
    access_level: 'Viewer' | 'Standard User' | 'Editor' | 'Admin Access';
    reason: string;
    duration_type: 'Temporary Access' | 'Permanent Access';
    start_date?: string;
    end_date?: string;
    assign_type: 'member' | 'team';
    assign_to_user_id?: string;
    assign_to_team_id?: string;
    status: number; // 0=Pending, 1=Approved, 2=Rejected, 3=Provisioned
    status_name: string;
    priority?: number; // 0=Low, 1=Medium, 2=High, 3=Critical
    notify_requester: boolean;
    require_manager_approval: boolean;
    approval_required: boolean;
    approver_ids?: any[];
    created_at: string;
    updated_at: string;
    requester?: any;
    assignedUser?: any;
    assignedTeam?: any;
    tracks?: any[];
    approval?: any;
    attachments?: any[];
    comments?: any[];
}

export interface AccessRequestStatistics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    provisioned: number;
}

@Injectable({
    providedIn: 'root'
})
export class AccessRequestService {
    private readonly apiUrl: string;

    constructor(private _httpClient: HttpClient) {
        this.apiUrl = (globalThis as any)?.__env?.API_URL ||
            (globalThis as any)?.process?.env?.API_URL ||
            (globalThis as any)?.API_URL ||
            'http://127.0.0.1:9010/api';
    }

    /**
     * Get all access requests with filters
     */
    getAccessRequests(params?: any): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    httpParams = httpParams.set(key, params[key].toString());
                }
            });
        }

        return this._httpClient.get<any>(`${this.apiUrl}/access-requests`, { params: httpParams });
    }

    /**
     * Get single access request
     */
    getAccessRequest(id: string): Observable<any> {
        return this._httpClient.get<any>(`${this.apiUrl}/access-requests/${id}`);
    }

    /**
     * Get statistics
     */
    getStatistics(params?: any): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    httpParams = httpParams.set(key, params[key].toString());
                }
            });
        }

        return this._httpClient.get<any>(`${this.apiUrl}/access-requests/statistics`, { params: httpParams });
    }

    /**
     * Create new access request
     */
    createAccessRequest(data: any): Observable<any> {
        return this._httpClient.post<any>(`${this.apiUrl}/access-requests`, data);
    }

    /**
     * Create access request with files
     */
    createAccessRequestWithFiles(formData: FormData): Observable<any> {
        return this._httpClient.post<any>(`${this.apiUrl}/access-requests`, formData);
    }

    /**
     * Update access request
     */
    updateAccessRequest(id: string, data: any): Observable<any> {
        return this._httpClient.put<any>(`${this.apiUrl}/access-requests/${id}`, data);
    }

    /**
     * Update access request with files
     */
    updateAccessRequestWithFiles(id: string, formData: FormData): Observable<any> {
        return this._httpClient.put<any>(`${this.apiUrl}/access-requests/${id}`, formData);
    }

    /**
     * Delete access request
     */
    deleteAccessRequest(id: string): Observable<any> {
        return this._httpClient.delete<any>(`${this.apiUrl}/access-requests/${id}`);
    }

    /**
     * Get priority label
     */
    getPriorityLabel(priority: number | null): string {
        if (priority === null || priority === undefined) {
            return 'Not Assigned';
        }
        const labels = ['Low', 'Medium', 'High', 'Critical'];
        return labels[priority] || 'Medium';
    }

    /**
     * Get status label
     */
    getStatusLabel(status: number): string {
        const labels = ['Pending', 'Approved', 'Rejected', 'Provisioned'];
        return labels[status] || 'Pending';
    }
}
