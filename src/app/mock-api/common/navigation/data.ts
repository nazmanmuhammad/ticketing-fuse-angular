/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'aside',
        icon: 'heroicons_outline:squares-2x2',
        children: [
            {
                id: 'dashboard.index',
                title: 'Dashboard',
                type: 'basic',
                icon: 'heroicons_outline:squares-2x2',
                link: '/dashboard',
            },
        ],
    },
    {
        id: 'task',
        title: 'Task',
        type: 'aside',
        icon: 'heroicons_outline:clipboard-document-list',
        children: [
            {
                id: 'task.index',
                title: 'Task',
                type: 'basic',
                icon: 'heroicons_outline:clipboard-document-list',
                link: '/task',
            },
        ],
    },
    {
        id: 'tickets',
        title: 'Tickets',
        type: 'aside',
        icon: 'heroicons_outline:ticket',
        children: [
            {
                id: 'tickets.dashboard',
                title: 'Dashboard',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/tickets/dashboard',
            },
            {
                id: 'tickets.list',
                title: 'Tickets',
                type: 'basic',
                icon: 'heroicons_outline:ticket',
                link: '/tickets/data',
            },
            {
                id: 'tickets.create',
                title: 'Create Ticket',
                type: 'basic',
                icon: 'heroicons_outline:plus-circle',
                link: '/tickets/create',
            },
        ],
    },
    {
        id: 'access_requests',
        title: 'Access Request',
        type: 'aside',
        icon: 'heroicons_outline:lock-closed',
        children: [
            {
                id: 'access_requests.dashboard',
                title: 'Dashboard',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/access-requests/dashboard',
            },
            {
                id: 'access_requests.list',
                title: 'Access Requests',
                type: 'basic',
                icon: 'heroicons_outline:lock-closed',
                link: '/access-requests/data',
            },
            {
                id: 'access_requests.create',
                title: 'Create Access Request',
                type: 'basic',
                icon: 'heroicons_outline:plus-circle',
                link: '/access-requests/create',
            },
        ],
    },
    {
        id: 'change_requests',
        title: 'Change Request',
        type: 'aside',
        icon: 'heroicons_outline:arrow-path',
        children: [
            {
                id: 'change_requests.dashboard',
                title: 'Dashboard',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/change-requests/dashboard',
            },
            {
                id: 'change_requests.list',
                title: 'Change Requests',
                type: 'basic',
                icon: 'heroicons_outline:arrow-path',
                link: '/change-requests/data',
            },
            {
                id: 'change_requests.create',
                title: 'Create Change Request',
                type: 'basic',
                icon: 'heroicons_outline:plus-circle',
                link: '/change-requests/create',
            },
        ],
    },
    {
        id: 'job_requests',
        title: 'Job Request',
        type: 'aside',
        icon: 'heroicons_outline:briefcase',
        children: [
            {
                id: 'job_requests.dashboard',
                title: 'Dashboard',
                type: 'basic',
                icon: 'heroicons_outline:chart-pie',
                link: '/job-requests/dashboard',
            },
            {
                id: 'job_requests.list',
                title: 'Job Requests',
                type: 'basic',
                icon: 'heroicons_outline:briefcase',
                link: '/job-requests/data',
            },
            {
                id: 'job_requests.create',
                title: 'Create Job Request',
                type: 'basic',
                icon: 'heroicons_outline:plus-circle',
                link: '/job-requests/create',
            },
        ],
    },
    {
        id: 'master_data',
        title: 'Master Data',
        type: 'aside',
        icon: 'heroicons_outline:circle-stack',
        children: [
            {
                id: 'master_data.user',
                title: 'User',
                type: 'basic',
                icon: 'heroicons_outline:users',
                link: '/master-data/users',
            },
            {
                id: 'master_data.department',
                title: 'Department',
                type: 'basic',
                icon: 'heroicons_outline:building-office',
                link: '/master-data/departments',
            },
            {
                id: 'master_data.team',
                title: 'Team',
                type: 'basic',
                icon: 'heroicons_outline:user-group',
                link: '/master-data/teams',
            },
            // {
            //     id: 'master_data.department',
            //     title: 'Department',
            //     type: 'basic',
            //     icon: 'heroicons_outline:rectangle-group',
            //     link: '/example',
            // },
        ],
    },
    {
        id: 'settings',
        title: 'Settings',
        type: 'aside',
        icon: 'heroicons_outline:cog-6-tooth',
        children: [
            {
                id: 'settings.application',
                title: 'Application Setting',
                type: 'basic',
                icon: 'heroicons_outline:window',
                link: '/settings/application',
            },
            {
                id: 'settings.smtp',
                title: 'SMTP Setting',
                type: 'basic',
                icon: 'heroicons_outline:envelope',
                link: '/settings/smtp',
            },
        ],
    },
];

export const compactNavigation: FuseNavigationItem[] = defaultNavigation;
export const futuristicNavigation: FuseNavigationItem[] = defaultNavigation;
export const horizontalNavigation: FuseNavigationItem[] = defaultNavigation;
