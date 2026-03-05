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
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface Ticket {
    id: number;
    title: string;
    description: string;
    assignee: string;
    avatar: string;
    status: 'OPEN' | 'INPROGRESS' | 'CLOSED';
    date: string;
}

@Component({
    selector: 'app-ticket',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule,
        MatSelectModule,
        MatOptionModule,
        MatFormFieldModule,
        MatInputModule
    ],
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
export class TicketComponent {
    // Filter state
    filterOpen = false;
    searchQuery = '';
    selectedPeriod = 'this_month';
    startDate = '2026-02-01';
    endDate = '2026-02-28';
    selectedStatus = '';
    itemsPerPage = 5;
    currentPage = 1;
    activeActionId: number | null = null;

    periods = [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'This Year', value: 'this_year' },
        { label: 'Custom Range', value: 'custom' },
    ];

    statuses = [
        { label: 'All Status', value: '' },
        { label: 'Open', value: 'OPEN' },
        { label: 'In Progress', value: 'INPROGRESS' },
        { label: 'Closed', value: 'CLOSED' },
    ];

    stats = [
        {
            title: 'New Tickets (Today)',
            value: 10,
            trend: '+5%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
            border: 'border-t-indigo-500',
        },
        {
            title: 'Pending Response',
            value: 3,
            trend: '-2%',
            up: false,
            bg: 'bg-orange-100',
            icon: 'text-orange-500',
            border: 'border-t-orange-500',
        },
        {
            title: 'Open Tickets',
            value: 3,
            trend: '+1.5%',
            up: true,
            bg: 'bg-blue-100',
            icon: 'text-blue-500',
            border: 'border-t-blue-500',
        },
        {
            title: 'Closed Tickets (This Month)',
            value: 4,
            trend: '+10%',
            up: true,
            bg: 'bg-green-100',
            icon: 'text-green-500',
            border: 'border-t-green-500',
        },
    ];

    tickets: Ticket[] = [
        {
            id: 1,
            title: 'Sed ut perspiciatis unde omnis iste',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Alice',
            avatar: 'A',
            status: 'INPROGRESS',
            date: '01 May 2024',
        },
        {
            id: 2,
            title: 'Xtreme theme dropdown issue',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Jonathan',
            avatar: 'J',
            status: 'OPEN',
            date: '03 May 2024',
        },
        {
            id: 3,
            title: 'Header issue in material admin',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Smith',
            avatar: 'S',
            status: 'CLOSED',
            date: '02 May 2024',
        },
        {
            id: 4,
            title: 'Sidebar issue in Nice admin',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Vincent',
            avatar: 'V',
            status: 'INPROGRESS',
            date: '06 May 2024',
        },
        {
            id: 5,
            title: 'Elegant Theme Side Menu show OnClick',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Chris',
            avatar: 'C',
            status: 'OPEN',
            date: '04 May 2024',
        },
        {
            id: 6,
            title: 'Dashboard chart not loading',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Alice',
            avatar: 'A',
            status: 'OPEN',
            date: '05 May 2024',
        },
        {
            id: 7,
            title: 'Login page redirect issue',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Smith',
            avatar: 'S',
            status: 'CLOSED',
            date: '07 May 2024',
        },
        {
            id: 8,
            title: 'Mobile layout broken on iOS',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Jonathan',
            avatar: 'J',
            status: 'INPROGRESS',
            date: '08 May 2024',
        },
        {
            id: 9,
            title: 'Export CSV button not working',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Vincent',
            avatar: 'V',
            status: 'OPEN',
            date: '09 May 2024',
        },
        {
            id: 10,
            title: 'Notification bell not showing badge',
            description: 'ab illo inventore veritatis et qua...',
            assignee: 'Chris',
            avatar: 'C',
            status: 'CLOSED',
            date: '10 May 2024',
        },
    ];

    avatarColors: Record<string, string> = {
        A: 'bg-indigo-400',
        J: 'bg-orange-400',
        S: 'bg-teal-400',
        V: 'bg-purple-400',
        C: 'bg-blue-400',
    };

    statusConfig: Record<string, { label: string; classes: string }> = {
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

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    applyFilter(): void {
        this.currentPage = 1;
        console.log(
            'Filter applied:',
            this.selectedPeriod,
            this.startDate,
            this.endDate,
            this.selectedStatus
        );
    }

    resetFilter(): void {
        this.searchQuery = '';
        this.selectedPeriod = 'this_month';
        this.selectedStatus = '';
        this.startDate = '2026-02-01';
        this.endDate = '2026-02-28';
        this.currentPage = 1;
    }

    onPeriodChange(): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        switch (this.selectedPeriod) {
            case 'today':
                const today = now.toISOString().split('T')[0];
                this.startDate = this.endDate = today;
                break;
            case 'this_week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const mon = new Date(new Date().setDate(diff));
                const sun = new Date(mon);
                sun.setDate(mon.getDate() + 6);
                this.startDate = mon.toISOString().split('T')[0];
                this.endDate = sun.toISOString().split('T')[0];
                break;
            case 'this_month':
                this.startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                this.endDate = new Date(year, month + 1, 0)
                    .toISOString()
                    .split('T')[0];
                break;
            case 'last_month':
                const lm = month === 0 ? 11 : month - 1;
                const ly = month === 0 ? year - 1 : year;
                this.startDate = `${ly}-${String(lm + 1).padStart(2, '0')}-01`;
                this.endDate = new Date(ly, lm + 1, 0)
                    .toISOString()
                    .split('T')[0];
                break;
            case 'this_year':
                this.startDate = `${year}-01-01`;
                this.endDate = `${year}-12-31`;
                break;
        }
    }

    get filteredTickets(): Ticket[] {
        return this.tickets.filter((t) => {
            const matchSearch =
                !this.searchQuery.trim() ||
                t.title
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()) ||
                t.assignee
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase());
            const matchStatus =
                !this.selectedStatus || t.status === this.selectedStatus;
            return matchSearch && matchStatus;
        });
    }

    get totalItems(): number {
        return this.filteredTickets.length;
    }
    get totalPages(): number {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }
    get paginatedTickets(): Ticket[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredTickets.slice(start, start + this.itemsPerPage);
    }
    get rangeLabel(): string {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(
            this.currentPage * this.itemsPerPage,
            this.totalItems
        );
        return `${start} - ${end} of ${this.totalItems}`;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }
    onItemsPerPageChange(): void {
        this.currentPage = 1;
    }
    toggleAction(id: number): void {
        this.activeActionId = this.activeActionId === id ? null : id;
    }
    editTicket(ticket: Ticket): void {
        console.log('Edit:', ticket);
    }
    deleteTicket(id: number): void {
        this.tickets = this.tickets.filter((t) => t.id !== id);
    }
    navigateToCreate(): void {
        /* router.navigate(['/tickets/create']) */
    }
}
