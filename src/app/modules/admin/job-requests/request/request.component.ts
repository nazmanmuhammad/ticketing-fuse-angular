import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';

interface JobRequest {
    id: number;
    code: string;
    title: string;
    department: string;
    requester: string;
    status: Status;
    requestDate: string;
}

@Component({
    selector: 'app-job-request-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatFormFieldModule, MatSelectModule, MatInputModule],
    templateUrl: './request.component.html',
    animations: [
        trigger('collapseFilter', [
            state(
                'open',
                style({
                    height: '*',
                    opacity: 1,
                    overflow: 'hidden',
                    marginTop: '20px',
                })
            ),
            state(
                'closed',
                style({
                    height: '0px',
                    opacity: 0,
                    overflow: 'hidden',
                    marginTop: '0px',
                })
            ),
            transition('open <=> closed', [animate('300ms ease-in-out')]),
        ]),
    ],
})
export class JobRequestListComponent {
    filterOpen = false;
    searchQuery = '';
    selectedPeriod = 'this_month';
    startDate = '2026-02-01';
    endDate = '2026-02-28';
    selectedStatus: '' | Status = '';
    itemsPerPage = 10;
    currentPage = 1;

    periods = [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'This Year', value: 'this_year' },
        { label: 'Custom Range', value: 'custom' },
    ];

    statuses = [
        { label: 'All Statuses', value: '' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Draft', value: 'DRAFT' },
    ];

    requests: JobRequest[] = [
        {
            id: 1,
            code: 'JR-2026-001',
            title: 'Senior Frontend Developer',
            department: 'Engineering',
            requester: 'John Doe',
            status: 'PENDING',
            requestDate: '2026-02-28',
        },
        {
            id: 2,
            code: 'JR-2026-002',
            title: 'Product Manager',
            department: 'Product',
            requester: 'Jane Smith',
            status: 'APPROVED',
            requestDate: '2026-02-25',
        },
        {
            id: 3,
            code: 'JR-2026-003',
            title: 'UX Designer',
            department: 'Design',
            requester: 'Alice Johnson',
            status: 'REJECTED',
            requestDate: '2026-02-20',
        },
        {
            id: 4,
            code: 'JR-2026-004',
            title: 'DevOps Engineer',
            department: 'Infrastructure',
            requester: 'Bob Brown',
            status: 'DRAFT',
            requestDate: '2026-03-01',
        },
        {
            id: 5,
            code: 'JR-2026-005',
            title: 'QA Engineer',
            department: 'Engineering',
            requester: 'Charlie Wilson',
            status: 'PENDING',
            requestDate: '2026-02-27',
        },
    ];

    get stats() {
        const total = this.requests.length;
        const pending = this.requests.filter((r) => r.status === 'PENDING').length;
        const approved = this.requests.filter((r) => r.status === 'APPROVED').length;
        const rejected = this.requests.filter((r) => r.status === 'REJECTED').length;

        return [
            {
                title: 'Total Requests',
                value: total,
                trend: '+5%',
                up: true,
                bg: 'bg-indigo-100',
                icon: 'text-indigo-500',
                border: 'border-t-indigo-500',
            },
            {
                title: 'Pending Approval',
                value: pending,
                trend: '+2%',
                up: true,
                bg: 'bg-orange-100',
                icon: 'text-orange-500',
                border: 'border-t-orange-500',
            },
            {
                title: 'Approved',
                value: approved,
                trend: '+10%',
                up: true,
                bg: 'bg-emerald-100',
                icon: 'text-emerald-600',
                border: 'border-t-emerald-500',
            },
            {
                title: 'Rejected',
                value: rejected,
                trend: '-1%',
                up: false,
                bg: 'bg-red-100',
                icon: 'text-red-600',
                border: 'border-t-red-500',
            },
        ];
    }

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    resetFilter(): void {
        this.selectedPeriod = 'this_month';
        this.startDate = '';
        this.endDate = '';
        this.selectedStatus = '';
        this.searchQuery = '';
    }
    
    applyFilter(): void {
        this.currentPage = 1;
        console.log(
            'Filter applied:',
            this.searchQuery,
            this.selectedPeriod,
            this.startDate,
            this.endDate,
            this.selectedStatus
        );
    }

    getStatusClass(status: Status): string {
        switch (status) {
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-700';
            case 'REJECTED':
                return 'bg-red-100 text-red-700';
            case 'PENDING':
                return 'bg-amber-100 text-amber-700';
            case 'DRAFT':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }
    
    onPeriodChange(): void {
        // Implement period change logic here if needed
        console.log('Period changed:', this.selectedPeriod);
    }
}
