export interface User {
    id: string | number;
    fullName: string;
    email: string;
    employeeId?: number;
    hrisUserId?: number;
    userId?: number;
    photo?: string;
    role: 'Admin' | 'Agent' | 'Manager' | 'Staff' | 'User';
    department?: string;
    departmentId?: string;
    lastLogin?: string;
    status: 'Active' | 'Inactive';
    avatar?: string;
}
