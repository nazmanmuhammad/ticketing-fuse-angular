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
                (m) => m.JobRequestDashboardComponent
            ),
        data: { title: 'Job Requests Dashboard' },
    },
    {
        path: 'data',
        loadComponent: () =>
            import('./request/request.component').then(
                (m) => m.JobRequestListComponent
            ),
        data: { title: 'Job Requests' },
    },
    {
        path: 'create',
        loadComponent: () =>
            import('./create/create.component').then(
                (m) => m.CreateJobRequestComponent
            ),
        data: { title: 'Create Job Request' },
    },
    {
        path: 'detail/:id',
        loadComponent: () =>
            import('./detail/detail.component').then(
                (m) => m.JobRequestDetailComponent
            ),
        data: { title: 'Job Request Detail' },
    },
];

export default routes;
