import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./task.component').then((m) => m.TaskComponent),
    },
] as Routes;
