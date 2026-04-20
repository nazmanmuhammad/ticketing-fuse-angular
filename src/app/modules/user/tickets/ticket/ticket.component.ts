import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { TicketService } from 'app/modules/admin/tickets/ticket.service';
import { take, finalize } from 'rxjs';

interface Ticket {
    id: string;
    ticket_number: string;
    name: string;
    email: string;
    phone_number: string;
    subject_issue: string;
    issue_detail: string;
    priority: number | null;
    status: number;
    status_name: string;
    pic_helpdesk?: any;
    pic_technical?: any;
    requester?: any;
    created_at: string;
    updated_at: string;
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
export class UserTicketComponent implements OnInit {
    filterOpen = false;
    searchQuery = '';
    selectedStatus = '';
    itemsPerPage = 10;
    currentPage = 1;
    currentUser: any = null;
    currentUserId: string = '';
    isLoading = false;
    totalItems = 0;
    totalPages = 0;

    statuses = [
        { label: 'All Status', value: '' },
        { label: 'Draft', value: '-1' },
        { label: 'Pending', value: '0' },
        { label: 'Process', value: '1' },
        { label: 'Resolved', value: '2' },
        { label: 'Closed', value: '3' },
        { label: 'Cancelled', value: '4' },
    ];

    tickets: Ticket[] = [];

    constructor(
        private _userService: UserService,
        private _ticketService: TicketService
    ) {}

    ngOnInit(): void {
        // Get current user
        this._userService.user$.pipe(take(1)).subscribe((user: User) => {
            this.currentUser = user;
            this.currentUserId = user?.id || '';
            this.loadTickets();
        });
    }

    loadTickets(): void {
        if (this.isLoading) return;

        this.isLoading = true;

        const params: any = {
            page: this.currentPage,
            per_page: this.itemsPerPage,
        };

        // Add user_id from me-validation
        if (this.currentUserId) {
            params.pic_id = this.currentUserId;
        }

        // Add search query
        if (this.searchQuery.trim()) {
            params.search = this.searchQuery.trim();
        }

        // Add status filter
        if (this.selectedStatus) {
            params.status = this.selectedStatus;
        }

        // Add role parameter for user tickets
        params.role = 'user';
        params.requester_id = this.currentUserId;

        console.log('Loading tickets with params:', params);

        this._ticketService.getTickets(params)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (response) => {
                    if (response && response.status) {
                        this.tickets = response.data || [];
                        this.totalItems = response.meta?.total || 0;
                        this.totalPages = response.meta?.last_page || 0;
                        
                        console.log('Tickets loaded:', this.tickets.length);
                        
                        // Debug: Log first ticket to check data structure
                        if (this.tickets.length > 0) {
                            console.log('First ticket data:', this.tickets[0]);
                            console.log('Subject Issue:', this.tickets[0].subject_issue);
                            console.log('Issue Detail:', this.tickets[0].issue_detail);
                        }
                    }
                },
                error: (error) => {
                    console.error('Error loading tickets:', error);
                    this.tickets = [];
                    this.totalItems = 0;
                    this.totalPages = 0;
                }
            });
    }

    get filteredTickets(): Ticket[] {
        // Return tickets directly from backend (already filtered)
        return this.tickets;
    }
    
    get paginatedTickets(): Ticket[] {
        // Return tickets directly (pagination handled by backend)
        return this.tickets;
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
        this.loadTickets();
    }
    
    onSearchChange(): void {
        this.currentPage = 1;
        this.loadTickets();
    }
    
    onStatusChange(): void {
        this.currentPage = 1;
        this.loadTickets();
    }
    
    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadTickets();
        }
    }
    
    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this.loadTickets();
    }

    getPriorityLabel(priority: number | null): string {
        if (priority === null || priority === undefined) {
            return 'Not Assigned';
        }
        const labels = ['Low', 'Normal', 'Medium', 'High', 'Critical'];
        return labels[priority] || 'Unknown';
    }

    getPriorityClass(priority: number | null): string {
        if (priority === null || priority === undefined) {
            return 'bg-gray-50 text-gray-500 border border-gray-200';
        }
        const classes = [
            'bg-gray-100 text-gray-700',
            'bg-blue-100 text-blue-700',
            'bg-orange-100 text-orange-700',
            'bg-red-100 text-red-700',
            'bg-purple-100 text-purple-700'
        ];
        return classes[priority] || 'bg-gray-100 text-gray-700';
    }

    getStatusClass(status: number): string {
        const classes = [
            'bg-yellow-50 text-yellow-700 ring-yellow-200', // Pending
            'bg-blue-50 text-blue-700 ring-blue-200',       // Process
            'bg-green-50 text-green-700 ring-green-200',    // Resolved
            'bg-green-50 text-green-700 ring-green-200',    // Closed
            'bg-red-50 text-red-700 ring-red-200'           // Cancelled
        ];
        
        // Handle draft status (-1)
        if (status === -1) {
            return 'bg-gray-50 text-gray-600 ring-gray-200';
        }
        
        return classes[status] || 'bg-gray-50 text-gray-700 ring-gray-200';
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    }
}
