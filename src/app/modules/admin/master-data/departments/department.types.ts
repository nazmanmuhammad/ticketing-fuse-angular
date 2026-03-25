import { User } from '../users/user.types';

export interface Department {
    id: string | number;
    name: string;
    description: string;
    head: User | null;
    status: 'Active' | 'Inactive';
    createdAt: string;
    departmentHeadName?: string;
}
