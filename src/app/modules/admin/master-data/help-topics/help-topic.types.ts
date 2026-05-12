export interface HelpTopic {
    id: string;
    name: string;
    description?: string;
    status: 'Active' | 'Inactive';
    createdAt?: string;
}
