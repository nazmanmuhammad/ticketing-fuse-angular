import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TicketCreateRequest {
    requester_type?: 'select_employee' | 'by_input';
    requester_id?: string | number;
    name: string;
    email: string;
    phone_number?: string;
    extension_number?: string;
    ticket_source: string;
    department_id?: string;
    help_topic?: string;
    subject_issue: string;
    issue_detail: string;
    priority: number;
    assign_status: 'member' | 'team';
    team_id?: string; // For team assignment
    pic_technical_id?: string; // For member assignment
    pic_helpdesk_id?: string;
    role?: string; // User role for email notification logic
    status?: number; // -1 for draft, 0 for pending, etc.
}

export interface TicketResponse {
    status: boolean;
    message: string;
    data: any;
}

export interface TicketListResponse {
    status: boolean;
    message: string;
    data: any[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

// Priority mapping
export const PRIORITY_MAP: { [key: string]: number } = {
    Low: 0,
    Medium: 1,
    High: 2,
    Critical: 3,
    Emergency: 4,
};

@Injectable({ providedIn: 'root' })
export class TicketService {
    private readonly apiUrl: string;

    constructor(private _httpClient: HttpClient) {
        this.apiUrl =
            (globalThis as any)?.__env?.API_URL ||
            (globalThis as any)?.process?.env?.API_URL ||
            (globalThis as any)?.API_URL ||
            'http://127.0.0.1:9010/api';
    }

    /**
     * Create a new ticket
     */
    createTicket(data: TicketCreateRequest): Observable<TicketResponse> {
        const url = `${this.apiUrl}/tickets`;
        return this._httpClient.post<TicketResponse>(url, data);
    }

    /**
     * Create a new ticket with file attachments
     */
    createTicketWithFiles(formData: FormData): Observable<TicketResponse> {
        const url = `${this.apiUrl}/tickets`;
        return this._httpClient.post<TicketResponse>(url, formData);
    }

    /**
     * Get single ticket by ID
     */
    getTicket(id: string, userId?: string): Observable<TicketResponse> {
        const url = `${this.apiUrl}/tickets/${id}`;
        let params = new HttpParams();
        
        if (userId) {
            params = params.set('user_id', userId);
        }
        
        return this._httpClient.get<TicketResponse>(url, { params });
    }

    /**
     * Get ticket statistics
     */
    getStatistics(params?: {
        role?: string;
        pic_helpdesk_id?: string;
        pic_id?: string;
        requester_id?: string | number;
    }): Observable<any> {
        const url = `${this.apiUrl}/tickets/statistics`;
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach((key) => {
                const value = params[key as keyof typeof params];
                if (value !== undefined && value !== null && value !== '') {
                    httpParams = httpParams.set(key, String(value));
                }
            });
        }

        return this._httpClient.get<any>(url, { params: httpParams });
    }

    /**
     * Get ticket list with pagination and filters
     */
    getTickets(params?: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string | number;
        role?: string;
        pic_helpdesk_id?: string;
        pic_id?: string;
        requester_id?: string | number;
    }): Observable<TicketListResponse> {
        const url = `${this.apiUrl}/tickets`;
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach((key) => {
                const value = params[key as keyof typeof params];
                if (value !== undefined && value !== null && value !== '') {
                    httpParams = httpParams.set(key, String(value));
                }
            });
        }

        return this._httpClient.get<TicketListResponse>(url, {
            params: httpParams,
        });
    }

    /**
     * Update ticket
     */
    updateTicket(id: string, data: any): Observable<TicketResponse> {
        const url = `${this.apiUrl}/tickets/${id}`;
        return this._httpClient.put<TicketResponse>(url, data);
    }

    /**
     * Update ticket with file attachments
     */
    updateTicketWithFiles(id: string, formData: FormData): Observable<TicketResponse> {
        const url = `${this.apiUrl}/tickets/${id}`;
        // Laravel doesn't support PUT with multipart/form-data, so we use POST with _method
        formData.append('_method', 'PUT');
        return this._httpClient.post<TicketResponse>(url, formData);
    }

    /**
     * Delete ticket
     */
    deleteTicket(id: string): Observable<TicketResponse> {
        const url = `${this.apiUrl}/tickets/${id}`;
        return this._httpClient.delete<TicketResponse>(url);
    }

    /**
     * Create a comment
     */
    createComment(formData: FormData): Observable<TicketResponse> {
        const url = `${this.apiUrl}/comments`;
        return this._httpClient.post<TicketResponse>(url, formData);
    }

    /**
     * Get comments for a commentable
     */
    getComments(commentableType: string, commentableId: string): Observable<TicketResponse> {
        const url = `${this.apiUrl}/comments?commentable_type=${commentableType}&commentable_id=${commentableId}`;
        return this._httpClient.get<TicketResponse>(url);
    }

    /**
     * Get users by role
     */
    getUsersByRole(role: string): Observable<TicketResponse> {
        const url = `${this.apiUrl}/users?role=${role}`;
        return this._httpClient.get<TicketResponse>(url);
    }
    
    /**
     * Get ticket counts for mini sidebar badges
     */
    getCounts(params?: {
        role?: string;
        user_id?: string;
        requester_id?: string | number;
    }): Observable<any> {
        const url = `${this.apiUrl}/tickets/counts`;
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach((key) => {
                const value = params[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }

        return this._httpClient.get<any>(url, { params: httpParams });
    }
}
