export interface User {
    id: number;
    fullName: string;
    email: string;
    role: 'Admin' | 'Agent' | 'Manager' | 'Staff' | 'User';
    department?: string;
    lastLogin?: string;
    status: 'Active' | 'Inactive';
    avatar?: string;
}
