export interface AccessLevel {
    id: string;
    request_type_id: string;
    name: string;
    description?: string;
    status: number;
    createdAt?: string;
    requestType?: {
        id: string;
        name: string;
    };
}
