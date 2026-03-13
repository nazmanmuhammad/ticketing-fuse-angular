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

type Status = 'OPEN' | 'INPROGRESS' | 'CLOSED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

interface ChangeRequest {
    id: number;
    code: string;
    requester: string;
    avatar: string;
    resource: string;
    resourceType: string;
    priority: Priority;
    status: Status;
    requestDate: string;
}

@Component({
    selector: 'app-change-request-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
    ],
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
export class ChangeRequestListComponent {
    filterOpen = false;
    searchQuery = '';
    selectedStatus: '' | Status = '';
    itemsPerPage = 5;
    currentPage = 1;

    statuses = [
        { label: 'All Status', value: '' },
        { label: 'Open', value: 'OPEN' as Status },
        { label: 'In Progress', value: 'INPROGRESS' as Status },
        { label: 'Closed', value: 'CLOSED' as Status },
    ];

    stats = [
        {
            title: 'New (Today)',
            value: 10,
            trend: '+5%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
            border: 'border-t-indigo-500',
        },
        {
            title: 'Pending',
            value: 3,
            trend: '-2%',
            up: false,
            bg: 'bg-orange-100',
            icon: 'text-orange-500',
            border: 'border-t-orange-500',
        },
        {
            title: 'Open',
            value: 3,
            trend: '+1.5%',
            up: true,
            bg: 'bg-blue-100',
            icon: 'text-blue-500',
            border: 'border-t-blue-500',
        },
        {
            title: 'Closed (This Month)',
            value: 4,
            trend: '+10%',
            up: true,
            bg: 'bg-green-100',
            icon: 'text-green-500',
            border: 'border-t-green-500',
        },
    ];

    requests: ChangeRequest[] = [
        {
            id: 1,
            code: '#1',
            requester: 'Alice',
            avatar: 'A',
            resource: 'Sed ut perspiciatis unde omnis iste',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'HIGH',
            status: 'INPROGRESS',
            requestDate: '01 May 2024',
        },
        {
            id: 2,
            code: '#2',
            requester: 'Jonathan',
            avatar: 'J',
            resource: 'Xtreme theme dropdown issue',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'MEDIUM',
            status: 'OPEN',
            requestDate: '03 May 2024',
        },
        {
            id: 3,
            code: '#3',
            requester: 'Smith',
            avatar: 'S',
            resource: 'Header issue in material admin',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'LOW',
            status: 'CLOSED',
            requestDate: '02 May 2024',
        },
        {
            id: 4,
            code: '#4',
            requester: 'Vincent',
            avatar: 'V',
            resource: 'Sidebar issue in Nice admin',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'HIGH',
            status: 'INPROGRESS',
            requestDate: '02 May 2024',
        },
        {
            id: 5,
            code: '#5',
            requester: 'Chris',
            avatar: 'C',
            resource: 'Elegant Theme Side Menu show OnClick',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'MEDIUM',
            status: 'OPEN',
            requestDate: '04 May 2024',
        },
    ];

    avatarColors: Record<string, string> = {
        A: 'bg-orange-400',
        J: 'bg-blue-400',
        S: 'bg-teal-400',
        V: 'bg-purple-400',
        C: 'bg-blue-400',
    };

    statusConfig: Record<Status, { label: string; classes: string }> = {
        OPEN: {
            label: 'OPEN',
            classes: 'text-blue-600 bg-blue-50 border border-blue-200',
        },
        INPROGRESS: {
            label: 'INPROGRESS',
            classes: 'text-orange-600 bg-orange-50 border border-orange-200',
        },
        CLOSED: {
            label: 'CLOSED',
            classes: 'text-gray-500 bg-gray-100 border border-gray-200',
        },
    };

    get filteredRequests(): ChangeRequest[] {
        return this.requests.filter((r) => {
            const q = this.searchQuery.toLowerCase().trim();
            const matchSearch =
                !q ||
                r.code.toLowerCase().includes(q) ||
                r.requester.toLowerCase().includes(q) ||
                r.resource.toLowerCase().includes(q);
            const matchStatus =
                !this.selectedStatus || r.status === this.selectedStatus;
            return matchSearch && matchStatus;
        });
    }

    get totalItems(): number {
        return this.filteredRequests.length;
    }
    get totalPages(): number {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }
    get paginatedRequests(): ChangeRequest[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredRequests.slice(start, start + this.itemsPerPage);
    }
    get rangeLabel(): string {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(
            this.currentPage * this.itemsPerPage,
            this.totalItems
        );
        return `${start} - ${end} of ${this.totalItems}`;
    }

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    applyFilter(): void {
        this.currentPage = 1;
    }

    resetFilter(): void {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.currentPage = 1;
    }
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }
    onItemsPerPageChange(): void {
        this.currentPage = 1;
    }

    navigateToCreate(): void {
        /* router.navigate(['/change-requests/create']) */
    }
}
