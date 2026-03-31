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
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { take } from 'rxjs';

type Status = 'OPEN' | 'INPROGRESS' | 'CLOSED';

interface ChangeRequest {
    id: number;
    code: string;
    requester: string;
    resource: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: Status;
    requestDate: string;
}

@Component({
    selector: 'app-user-change-request-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
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
export class UserChangeRequestListComponent {
    filterOpen = false;
    searchQuery = '';
    selectedStatus: '' | Status = '';
    itemsPerPage = 5;
    currentPage = 1;
    currentUser = 'Alice';

    statuses = [
        { label: 'All Status', value: '' },
        { label: 'Open', value: 'OPEN' as Status },
        { label: 'In Progress', value: 'INPROGRESS' as Status },
        { label: 'Closed', value: 'CLOSED' as Status },
    ];

    requests: ChangeRequest[] = [
        { id: 1, code: '#CR1', requester: 'Alice', resource: 'Deploy Config', priority: 'HIGH', status: 'INPROGRESS', requestDate: '01 May 2024' },
        { id: 2, code: '#CR2', requester: 'Jonathan', resource: 'Update Header', priority: 'MEDIUM', status: 'OPEN', requestDate: '03 May 2024' },
        { id: 3, code: '#CR3', requester: 'Alice', resource: 'Fix Sidebar', priority: 'LOW', status: 'CLOSED', requestDate: '04 May 2024' },
    ];

    constructor(private _userService: UserService) {
        this._userService.user$.pipe(take(1)).subscribe((user: User) => {
            this.currentUser = (user?.name || 'Alice').trim() || 'Alice';
        });
    }

    private isAssignedToMe(request: ChangeRequest): boolean {
        return (
            !!request.requester &&
            request.requester.toLowerCase() === this.currentUser.toLowerCase()
        );
    }

    get filteredRequests(): ChangeRequest[] {
        return this.requests.filter((r) => {
            const q = this.searchQuery.toLowerCase().trim();
            const matchSearch =
                !q ||
                r.code.toLowerCase().includes(q) ||
                r.requester.toLowerCase().includes(q) ||
                r.resource.toLowerCase().includes(q);
            const matchStatus = !this.selectedStatus || r.status === this.selectedStatus;
            return matchSearch && matchStatus && this.isAssignedToMe(r);
        });
    }

    get totalItems(): number {
        return this.filteredRequests.length;
    }
    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    }
    get paginatedRequests(): ChangeRequest[] {
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
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }
    onItemsPerPageChange(): void {
        this.currentPage = 1;
    }
}
