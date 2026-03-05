import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./dashboard/dashboard.component').then(
                (m) => m.ChangeRequestsDashboardComponent
            ),
        data: { title: 'Change Requests Dashboard' },
    },
    {
        path: 'data',
        loadComponent: () =>
            import('./request/request.component').then(
                (m) => m.ChangeRequestListComponent
            ),
        data: { title: 'Change Requests' },
    },
    {
        path: 'create',
        loadComponent: () =>
            import('./create/create.component').then(
                (m) => m.CreateChangeRequestComponent
            ),
        data: { title: 'Create Change Request' },
    },
    {
        path: 'detail/:id',
        loadComponent: () =>
            import('./detail/detail.component').then(
                (m) => m.ChangeRequestDetailComponent
            ),
        data: { title: 'Change Request Detail' },
    },
];

export default routes;
