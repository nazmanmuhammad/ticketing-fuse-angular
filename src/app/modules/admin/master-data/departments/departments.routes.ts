import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./list/department-list.component').then((m) => m.DepartmentListComponent),
        data: { title: 'Department Management' },
    }
];

export default routes;
