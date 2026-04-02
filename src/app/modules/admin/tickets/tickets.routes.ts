import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'dashboard', // ← SPECIFIC path, bukan root
        loadComponent: () =>
            import('./dashboard/dashboard.component').then(
                (m) => m.DashboardComponent
            ),
        data: { title: 'Tickets Dashboard' },
    },
    {
        path: 'data',
        loadComponent: () =>
            import('./ticket/ticket.component').then((m) => m.TicketComponent),
        data: { title: 'Ticket List' },
    },
    {
        path: 'create',
        loadComponent: () =>
            import('./create/create.component').then((m) => m.CreateComponent), // ← create component terpisah
        data: { title: 'Create Ticket' },
    },
    {
        path: 'edit/:id',
        loadComponent: () =>
            import('./edit/edit.component').then((m) => m.EditComponent),
        data: { title: 'Edit Ticket' },
    },
    {
        path: 'detail/:id',
        loadComponent: () =>
            import('./detail/detail.component').then((m) => m.DetailComponent),
        data: { title: 'Ticket Detail' },
    },
];

export default routes;
