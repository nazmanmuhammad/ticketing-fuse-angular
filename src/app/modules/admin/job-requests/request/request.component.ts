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
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { take } from 'rxjs';

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
    itemsPerPage = 5;
    currentPage = 1;
    activeTab: 'all' | 'assigned' = 'all';
    currentUser = 'Alice';

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

    constructor(private _userService: UserService) {
        this._userService.user$.pipe(take(1)).subscribe((user: User) => {
            this.currentUser = (user?.name || 'Alice').trim() || 'Alice';
        });
    }

    setTab(tab: 'all' | 'assigned'): void {
        this.activeTab = tab;
        this.currentPage = 1;
    }

    private isAssignedToMe(request: JobRequest): boolean {
        return (
            !!request.requester &&
            request.requester.toLowerCase() === this.currentUser.toLowerCase()
        );
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

    get filteredRequests(): JobRequest[] {
        const query = this.searchQuery.toLowerCase().trim();
        const base = this.requests.filter((request) => {
            const matchSearch =
                !query ||
                request.code.toLowerCase().includes(query) ||
                request.title.toLowerCase().includes(query) ||
                request.department.toLowerCase().includes(query) ||
                request.requester.toLowerCase().includes(query);
            const matchStatus =
                !this.selectedStatus || request.status === this.selectedStatus;
            return matchSearch && matchStatus;
        });

        if (this.activeTab === 'assigned') {
            return base.filter((request) => this.isAssignedToMe(request));
        }

        return base;
    }

    get countAll(): number {
        return this.requests.length;
    }

    get countAssigned(): number {
        return this.requests.filter((request) => this.isAssignedToMe(request)).length;
    }

    get totalItems(): number {
        return this.filteredRequests.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    }

    get paginatedRequests(): JobRequest[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredRequests.slice(start, start + this.itemsPerPage);
    }

    get rangeLabel(): string {
        if (this.totalItems === 0) {
            return '0 - 0 of 0';
        }
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        return `${start} - ${end} of ${this.totalItems}`;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
    }
}
