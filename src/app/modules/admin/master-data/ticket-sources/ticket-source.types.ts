export interface TicketSource {
    id: string;
    name: string;
    description?: string;
    status: 'Active' | 'Inactive';
    createdAt?: string;
}
