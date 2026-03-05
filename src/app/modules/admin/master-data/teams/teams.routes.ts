import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./list/team-list.component').then((m) => m.TeamListComponent),
        data: { title: 'Team Management' },
    }
];

export default routes;
