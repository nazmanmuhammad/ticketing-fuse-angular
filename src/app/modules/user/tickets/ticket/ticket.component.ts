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

interface Ticket {
    id: number;
    title: string;
    assignee: string;
    status: 'OPEN' | 'INPROGRESS' | 'CLOSED';
    date: string;
}

@Component({
    selector: 'app-user-ticket',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatSelectModule,
        MatOptionModule,
        MatFormFieldModule,
        MatInputModule,
        RouterModule,
    ],
    host: {
        class: 'block h-full w-full',
    },
    templateUrl: './ticket.component.html',
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
export class UserTicketComponent {
    filterOpen = false;
    searchQuery = '';
    selectedStatus = '';
    itemsPerPage = 5;
    currentPage = 1;
    currentUser = 'Alice';

    statuses = [
        { label: 'All Status', value: '' },
        { label: 'Open', value: 'OPEN' },
        { label: 'In Progress', value: 'INPROGRESS' },
        { label: 'Closed', value: 'CLOSED' },
    ];

    tickets: Ticket[] = [
        {
            id: 1,
            title: 'Sed ut perspiciatis unde omnis iste',
            assignee: 'Alice',
            status: 'INPROGRESS',
            date: '01 May 2024',
        },
        {
            id: 2,
            title: 'Xtreme theme dropdown issue',
            assignee: 'Jonathan',
            status: 'OPEN',
            date: '03 May 2024',
        },
        {
            id: 3,
            title: 'Header issue in material admin',
            assignee: 'Smith',
            status: 'CLOSED',
            date: '02 May 2024',
        },
        {
            id: 4,
            title: 'Sidebar issue in Nice admin',
            assignee: 'Vincent',
            status: 'INPROGRESS',
            date: '06 May 2024',
        },
    ];

    constructor(private _userService: UserService) {
        this._userService.user$.pipe(take(1)).subscribe((user: User) => {
            this.currentUser = (user?.name || 'Alice').trim() || 'Alice';
        });
    }

    private isAssignedToMe(t: Ticket): boolean {
        return (
            !!t.assignee &&
            t.assignee.toLowerCase() === this.currentUser.toLowerCase()
        );
    }

    get filteredTickets(): Ticket[] {
        return this.tickets.filter((t) => {
            const matchSearch =
                !this.searchQuery.trim() ||
                t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                t.assignee.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchStatus = !this.selectedStatus || t.status === this.selectedStatus;
            return matchSearch && matchStatus && this.isAssignedToMe(t);
        });
    }

    get totalItems(): number {
        return this.filteredTickets.length;
    }
    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    }
    get paginatedTickets(): Ticket[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredTickets.slice(start, start + this.itemsPerPage);
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
