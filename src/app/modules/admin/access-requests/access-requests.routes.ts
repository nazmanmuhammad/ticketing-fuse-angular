import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./dashboard/dashboard.component').then(
                (m) => m.AccessRequestDashboardComponent
            ),
        data: { title: 'Access Requests Dashboard' },
    },
    {
        path: 'data',
        loadComponent: () =>
            import('./request/request.component').then(
                (m) => m.AccessRequestListComponent
            ),
        data: { title: 'Access Requests' },
    },
    {
        path: 'create',
        loadComponent: () =>
            import('./create/create.component').then(
                (m) => m.CreateAccessRequestComponent
            ),
        data: { title: 'Create Access Request' },
    },
    {
        path: 'edit/:id',
        loadComponent: () =>
            import('./edit/edit.component').then(
                (m) => m.EditAccessRequestComponent
            ),
        data: { title: 'Edit Access Request' },
    },
    {
        path: 'detail/:id',
        loadComponent: () =>
            import('./detail/detail.component').then(
                (m) => m.AccessRequestDetailComponent
            ),
        data: { title: 'Access Request Detail' },
    },
];

export default routes;
