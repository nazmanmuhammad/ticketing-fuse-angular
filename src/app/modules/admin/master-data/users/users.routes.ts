import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./list/user-list.component').then((m) => m.UserListComponent),
        data: { title: 'User Management' },
    }
];

export default routes;
