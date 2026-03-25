export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    photo?: string;
    status?: string;
    role_name?: string;
    hris_user_id?: number | string;
    department_id?: string;
}
