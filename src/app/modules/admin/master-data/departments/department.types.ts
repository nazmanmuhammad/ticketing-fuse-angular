import { User } from '../users/user.types';

export interface Department {
    id: number;
    name: string;
    description: string;
    head: User | null;
    status: 'Active' | 'Inactive';
    createdAt: string;
}
