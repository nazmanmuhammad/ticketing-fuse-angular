import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirect empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'landing' },

    // Redirect signed-in user to the '/example'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'task' },

    // Landing route for guests
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'landing',
                loadChildren: () => import('app/modules/landing/landing.routes'),
            },
        ],
    },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'confirmation-required',
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation-required/confirmation-required.routes'
                    ),
            },
            {
                path: 'forgot-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.routes'
                    ),
            },
            {
                path: 'reset-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/reset-password/reset-password.routes'
                    ),
            },
            {
                path: 'sign-in',
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.routes'),
            },
            {
                path: 'sign-up',
                loadChildren: () =>
                    import('app/modules/auth/sign-up/sign-up.routes'),
            },
            {
                path: 'request-access',
                loadChildren: () =>
                    import('app/modules/auth/request-access/request-access.routes'),
            },
        ],
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'sign-out',
                loadChildren: () =>
                    import('app/modules/auth/sign-out/sign-out.routes'),
            },
            {
                path: 'unlock-session',
                loadChildren: () =>
                    import(
                        'app/modules/auth/unlock-session/unlock-session.routes'
                    ),
            },
        ],
    },


    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: 'dashboard',
                loadChildren: () =>
                    import('app/modules/admin/dashboard/dashboard.routes'),
            },
            {
                path: 'task',
                loadChildren: () =>
                    import('app/modules/admin/task/task.routes'),
            },
            {
                path: 'example',
                loadChildren: () =>
                    import('app/modules/admin/example/example.routes'),
            },
            {
                path: 'tickets',
                loadChildren: () =>
                    import('app/modules/admin/tickets/tickets.routes'),
            },
            {
                path: 'access-requests',
                loadChildren: () =>
                    import(
                        'app/modules/admin/access-requests/access-requests.routes'
                    ),
            },
            {
                path: 'change-requests',
                loadChildren: () =>
                    import(
                        'app/modules/admin/change-requests/change-requests.routes'
                    ),
            },
            {
                path: 'job-requests',
                loadChildren: () =>
                    import(
                        'app/modules/admin/job-requests/job-requests.routes'
                    ),
            },
            {
                path: 'master-data/users',
                loadChildren: () =>
                    import(
                        'app/modules/admin/master-data/users/users.routes'
                    ),
            },
            {
                path: 'master-data/teams',
                loadChildren: () =>
                    import(
                        'app/modules/admin/master-data/teams/teams.routes'
                    ),
            },
            {
                path: 'master-data/departments',
                loadChildren: () =>
                    import(
                        'app/modules/admin/master-data/departments/departments.routes'
                    ),
            },
            {
                path: 'settings',
                loadChildren: () =>
                    import('app/modules/admin/settings/settings.routes'),
            },
        ],
    },
];
