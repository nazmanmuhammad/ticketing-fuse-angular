import { Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'application',
    },
    {
        path: 'application',
        loadComponent: () =>
            import('./application/application.component').then(
                (m) => m.ApplicationSettingComponent
            ),
        data: { title: 'Application Setting' },
    },
    {
        path: 'smtp',
        loadComponent: () =>
            import('./smtp/smtp.component').then((m) => m.SmtpSettingComponent),
        data: { title: 'SMTP Setting' },
    },
];

export default routes;
