import { User } from '../users/user.types';

export interface Team {
    id: number;
    name: string;
    description: string;
    members: User[];
    status?: 'Active' | 'Inactive';
}
