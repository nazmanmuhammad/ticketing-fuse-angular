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
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
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
    selector: 'app-user-job-request-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatOptionModule,
        RouterModule,
    ],
    host: {
        class: 'block h-full w-full',
    },
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
export class UserJobRequestListComponent {
    filterOpen = false;
    searchQuery = '';
    selectedStatus: '' | Status = '';
    itemsPerPage = 5;
    currentPage = 1;
    currentUser = 'Alice';

    statuses = [
        { label: 'All Statuses', value: '' },
        { label: 'Pending', value: 'PENDING' as Status },
        { label: 'Approved', value: 'APPROVED' as Status },
        { label: 'Rejected', value: 'REJECTED' as Status },
        { label: 'Draft', value: 'DRAFT' as Status },
    ];

    requests: JobRequest[] = [
        {
            id: 1,
            code: 'JR-2026-001',
            title: 'Senior Frontend Developer',
            department: 'Engineering',
            requester: 'Alice',
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
            requester: 'Alice',
            status: 'REJECTED',
            requestDate: '2026-02-20',
        },
    ];

    constructor(private _userService: UserService) {
        this._userService.user$.pipe(take(1)).subscribe((user: User) => {
            this.currentUser = (user?.name || 'Alice').trim() || 'Alice';
        });
    }

    private isAssignedToMe(request: JobRequest): boolean {
        return (
            !!request.requester &&
            request.requester.toLowerCase() === this.currentUser.toLowerCase()
        );
    }

    get filteredRequests(): JobRequest[] {
        const query = this.searchQuery.toLowerCase().trim();
        return this.requests.filter((request) => {
            const matchSearch =
                !query ||
                request.code.toLowerCase().includes(query) ||
                request.title.toLowerCase().includes(query) ||
                request.department.toLowerCase().includes(query) ||
                request.requester.toLowerCase().includes(query);
            const matchStatus =
                !this.selectedStatus || request.status === this.selectedStatus;
            return matchSearch && matchStatus && this.isAssignedToMe(request);
        });
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

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }
    resetFilter(): void {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.currentPage = 1;
    }
    applyFilter(): void {
        this.currentPage = 1;
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
