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
import { Router, RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TicketService } from '../ticket.service';
import { UserService } from 'app/core/user/user.service';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { ConfirmationDialogService } from 'app/core/services/confirmation-dialog.service';
import { catchError, finalize, of, switchMap } from 'rxjs';

interface Ticket {
    id: string;
    requester_id?: string;
    name: string;
    email: string;
    phone_number?: string;
    extension_number?: string;
    ticket_source: string;
    department_id?: string;
    help_topic?: string;
    subject_issue: string;
    issue_detail: string;
    priority: number;
    assign_status: 'member' | 'team';
    team_id?: string;
    pic_technical_id?: string;
    pic_helpdesk_id?: string;
    status: number;
    status_name: string;
    created_at: string;
    updated_at: string;
    // Relations
    requester?: {
        id: string;
        hris_user_id: number;
        name: string;
        email: string;
        department_id: string;
        role: number;
        status: number;
        photo: string;
        role_name: string;
    } | null;
    pic_technical?: {
        id: string;
        hris_user_id: number;
        name: string;
        email: string;
        department_id: string;
        role: number;
        status: number;
        photo: string;
        role_name: string;
    } | null;
    pic_helpdesk?: {
        id: string;
        hris_user_id: number;
        name: string;
        email: string;
        department_id: string;
        role: number;
        status: number;
        photo: string;
        role_name: string;
    } | null;
    team?: {
        id: string;
        name: string;
        description: string;
    } | null;
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
        MatInputModule,
        MatTooltipModule,
        TranslocoModule
    ],
    templateUrl: './ticket.component.html',
    styles: [`
        /* Hover effect for description */
        .cursor-help:hover {
            background-color: rgba(99, 102, 241, 0.05);
            border-radius: 4px;
            transition: background-color 0.2s ease;
            padding: 2px 4px;
            margin: -2px -4px;
        }

        /* Action button hover effects */
        .action-button:hover {
            transform: translateY(-1px);
            transition: transform 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Badge hover effects */
        .rounded-full.cursor-help:hover {
            transform: scale(1.05);
            transition: transform 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
    `],
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
export class TicketComponent implements OnInit {
    // Filter state
    filterOpen = false;
    searchQuery = '';
    selectedPeriod = 'this_month';
    startDate = '2026-02-01';
    endDate = '2026-02-28';
    selectedStatus = '';
    itemsPerPage = 10;
    currentPage = 1;
    activeActionId: string | null = null;
    activeTab: 'all' | 'assigned' = 'all';
    currentUser: any = null;
    isLoading = false;
    tickets: Ticket[] = [];
    totalItems = 0;
    totalPages = 0;

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
        { label: 'Pending', value: '0' },
        { label: 'Process', value: '1' },
        { label: 'Resolved', value: '2' },
        { label: 'Closed', value: '3' },
    ];

    stats = [
        {
            title: 'New Tickets (Today)',
            value: 0,
            trend: '+5%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
            border: 'border-t-indigo-500',
        },
        {
            title: 'Pending Response',
            value: 0,
            trend: '-2%',
            up: false,
            bg: 'bg-orange-100',
            icon: 'text-orange-500',
            border: 'border-t-orange-500',
        },
        {
            title: 'Open Tickets',
            value: 0,
            trend: '+1.5%',
            up: true,
            bg: 'bg-blue-100',
            icon: 'text-blue-500',
            border: 'border-t-blue-500',
        },
        {
            title: 'Closed Tickets (This Month)',
            value: 0,
            trend: '+10%',
            up: true,
            bg: 'bg-green-100',
            icon: 'text-green-500',
            border: 'border-t-green-500',
        },
    ];

    constructor(
        private _ticketService: TicketService,
        private _userService: UserService,
        private _snackbar: SnackbarService,
        private _confirmDialog: ConfirmationDialogService,
        private _translocoService: TranslocoService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Get current user
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
            // Load tickets and statistics after getting user info
            this.loadTickets();
            this.loadStatistics();
        });

        // Wait for translations to load before updating
        this._translocoService.events$.subscribe((event) => {
            if (event.type === 'translationLoadSuccess') {
                this.updateTranslations();
            }
        });

        // Update translations when language changes
        this._translocoService.langChanges$.subscribe(() => {
            this.updateTranslations();
        });
    }

    loadStatistics(): void {
        if (!this.currentUser) return;

        const params: any = {};
        
        // Add user_id from me-validation
        if (this.currentUser.id) {
            params.user_id = this.currentUser.id;
        }
        
        // Add role-based parameters
        if (this.currentUser.role_name === 'Agent') {
            params.role = 'agent';
            params.pic_helpdesk_id = this.currentUser.id;
        } else if (this.currentUser.role_name === 'Technical') {
            params.role = 'technical';
            params.pic_id = this.currentUser.id;
        } else if (this.currentUser.role_name === 'User') {
            params.role = 'user';
            params.requester_id = this.currentUser.hris_user_id;
        }

        this._ticketService.getStatistics(params)
            .pipe(
                catchError((error) => {
                    console.error('Error loading statistics:', error);
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    // Update stats values
                    this.stats[0].value = response.data.new_today || 0;
                    this.stats[1].value = response.data.pending || 0;
                    this.stats[2].value = response.data.open || 0;
                    this.stats[3].value = response.data.closed_this_month || 0;
                }
            });
    }

    private updateTranslations(): void {
        // Update periods
        this.periods = [
            { label: this._translocoService.translate('TICKETS.FILTERS.PERIODS.TODAY'), value: 'today' },
            { label: this._translocoService.translate('TICKETS.FILTERS.PERIODS.THIS_WEEK'), value: 'this_week' },
            { label: this._translocoService.translate('TICKETS.FILTERS.PERIODS.THIS_MONTH'), value: 'this_month' },
            { label: this._translocoService.translate('TICKETS.FILTERS.PERIODS.LAST_MONTH'), value: 'last_month' },
            { label: this._translocoService.translate('TICKETS.FILTERS.PERIODS.THIS_YEAR'), value: 'this_year' },
            { label: this._translocoService.translate('TICKETS.FILTERS.PERIODS.CUSTOM'), value: 'custom' },
        ];

        // Update statuses
        this.statuses = [
            { label: this._translocoService.translate('TICKETS.STATUS.ALL'), value: '' },
            { label: this._translocoService.translate('TICKETS.STATUS.PENDING'), value: '0' },
            { label: this._translocoService.translate('TICKETS.STATUS.PROCESS'), value: '1' },
            { label: this._translocoService.translate('TICKETS.STATUS.RESOLVED'), value: '2' },
            { label: this._translocoService.translate('TICKETS.STATUS.CLOSED'), value: '3' },
        ];

        // Update stats - preserve existing values
        const currentValues = this.stats.map(s => s.value);
        this.stats = [
            {
                title: this._translocoService.translate('TICKETS.STATS.NEW_TODAY'),
                value: currentValues[0] || 0,
                trend: '+5%',
                up: true,
                bg: 'bg-indigo-100',
                icon: 'text-indigo-500',
                border: 'border-t-indigo-500',
            },
            {
                title: this._translocoService.translate('TICKETS.STATS.PENDING_RESPONSE'),
                value: currentValues[1] || 0,
                trend: '-2%',
                up: false,
                bg: 'bg-orange-100',
                icon: 'text-orange-500',
                border: 'border-t-orange-500',
            },
            {
                title: this._translocoService.translate('TICKETS.STATS.OPEN_TICKETS'),
                value: currentValues[2] || 0,
                trend: '+1.5%',
                up: true,
                bg: 'bg-blue-100',
                icon: 'text-blue-500',
                border: 'border-t-blue-500',
            },
            {
                title: this._translocoService.translate('TICKETS.STATS.CLOSED_THIS_MONTH'),
                value: currentValues[3] || 0,
                trend: '+10%',
                up: true,
                bg: 'bg-green-100',
                icon: 'text-green-500',
                border: 'border-t-green-500',
            },
        ];
    }

    loadTickets(): void {
        if (this.isLoading) return;

        this.isLoading = true;

        const params: any = {
            page: this.currentPage,
            per_page: this.itemsPerPage,
        };

        // Add user_id from me-validation
        if (this.currentUser && this.currentUser.id) {
            params.user_id = this.currentUser.id;
        }

        // Add search query
        if (this.searchQuery.trim()) {
            params.search = this.searchQuery.trim();
        }

        // Add status filter
        if (this.selectedStatus) {
            params.status = this.selectedStatus;
        }

        // Add role-based filtering
        if (this.currentUser) {
            const roleName = (this.currentUser.role_name || '').toLowerCase();
            
            if (roleName === 'agent') {
                params.role = 'agent';
                if (this.activeTab === 'assigned') {
                    params.pic_helpdesk_id = this.currentUser.id;
                }
            } else if (roleName === 'technical') {
                params.role = 'technical';
                if (this.activeTab === 'assigned') {
                    params.pic_id = this.currentUser.id;
                }
            } else if (roleName === 'user') {
                params.role = 'user';
                if (this.activeTab === 'assigned') {
                    params.requester_id = this.currentUser.id;
                }
            }
        }

        console.log('Loading tickets with params:', params);

        this._ticketService
            .getTickets(params)
            .pipe(
                catchError((error) => {
                    console.error('Error loading tickets:', error);
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this.tickets = response.data || [];
                    this.totalItems = response.meta?.total || 0;
                    this.totalPages = response.meta?.last_page || 0;
                    console.log('Tickets loaded:', this.tickets.length);
                } else {
                    this._snackbar.error(this._translocoService.translate('TICKETS.MESSAGES.LOAD_FAILED'));
                }
            });
    }

toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadTickets();
    }

    setTab(tab: 'all' | 'assigned'): void {
        this.activeTab = tab;
        this.currentPage = 1;
        this.loadTickets();
    }

    resetFilter(): void {
        this.searchQuery = '';
        this.selectedPeriod = 'this_month';
        this.selectedStatus = '';
        this.startDate = '2026-02-01';
        this.endDate = '2026-02-28';
        this.currentPage = 1;
        this.loadTickets();
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
        return this.tickets;
    }

    get paginatedTickets(): Ticket[] {
        return this.tickets;
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
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadTickets();
        }
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this.loadTickets();
    }

    toggleAction(id: string): void {
        this.activeActionId = this.activeActionId === id ? null : id;
    }

    editTicket(ticket: Ticket): void {
        console.log(ticket);
        this.router.navigate(['/tickets/edit', ticket.id]);
    }

    deleteTicket(id: string): void {
        this._confirmDialog
            .confirmDelete('this ticket')
            .pipe(
                switchMap((confirmed) => {
                    if (confirmed) {
                        return this._ticketService.deleteTicket(id).pipe(
                            catchError((error) => {
                                console.error('Error deleting ticket:', error);
                                this._snackbar.error(
                                    error?.error?.message ||
                                        'Failed to delete ticket'
                                );
                                return of(null);
                            })
                        );
                    }
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success(this._translocoService.translate('TICKETS.MESSAGES.DELETED_SUCCESS'));
                    this.loadTickets();
                }
            });
    }

    get countAll(): number {
        return this.totalItems;
    }

    get countAssigned(): number {
        // This will be calculated from API response
        return this.totalItems;
    }

    getStatusBadgeClass(status: number): string {
        const statusMap: Record<number, string> = {
            0: 'text-gray-600 bg-gray-50 border border-gray-200', // Pending
            1: 'text-blue-600 bg-blue-50 border border-blue-200', // Process
            2: 'text-green-600 bg-green-50 border border-green-200', // Resolved
            3: 'text-gray-500 bg-gray-100 border border-gray-200', // Closed
        };
        return statusMap[status] || statusMap[0];
    }

    getPriorityLabel(priority: number): string {
        const priorityMap: Record<number, string> = {
            0: 'Low',
            1: 'Medium',
            2: 'High',
            3: 'Critical',
            4: 'Emergency',
        };
        return priorityMap[priority] || 'Low';
    }

    getPriorityColor(priority: number): string {
        const colorMap: Record<number, string> = {
            0: 'text-gray-600',
            1: 'text-blue-600',
            2: 'text-orange-600',
            3: 'text-red-600',
            4: 'text-purple-600',
        };
        return colorMap[priority] || 'text-gray-600';
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    getInitial(name: string): string {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    getAssignedName(ticket: Ticket): string {
        if (ticket.pic_technical) {
            return ticket.pic_technical.name;
        } else if (ticket.team) {
            return ticket.team.name;
        }
        return 'Unassigned';
    }

    getAssignedInitial(ticket: Ticket): string {
        const name = this.getAssignedName(ticket);
        return this.getInitial(name);
    }

    getRequesterName(ticket: Ticket): string {
        if (ticket.requester) {
            return ticket.requester.name;
        }
        return ticket.name || 'Unknown';
    }

    getRequesterEmail(ticket: Ticket): string {
        if (ticket.requester) {
            return ticket.requester.email;
        }
        return ticket.email || '';
    }

    getRequesterInitial(ticket: Ticket): string {
        const name = this.getRequesterName(ticket);
        return this.getInitial(name);
    }

    getRequesterAvatar(ticket: Ticket): string | null {
        if (ticket.requester?.photo) {
            const photoBase = this.getPhotoBaseUrl();
            return `${photoBase}/assets/img/user/${ticket.requester.photo}`;
        }
        return null;
    }

    getAssignedAvatar(ticket: Ticket): string | null {
        if (ticket.pic_technical?.photo) {
            const photoBase = this.getPhotoBaseUrl();
            return `${photoBase}/assets/img/user/${ticket.pic_technical.photo}`;
        }
        return null;
    }

    private getPhotoBaseUrl(): string {
        const hrisApiUrl =
            (globalThis as any)?.__env?.HRIS_API_URL ||
            (globalThis as any)?.process?.env?.HRIS_API_URL ||
            (globalThis as any)?.HRIS_API_URL ||
            'https://back.siglab.co.id';
        return hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
    }

    getPriorityBadgeClass(priority: number): string {
        const colorMap: Record<number, string> = {
            0: 'bg-gray-100 text-gray-700 border border-gray-300', // Low
            1: 'bg-blue-100 text-blue-700 border border-blue-300', // Medium
            2: 'bg-orange-100 text-orange-700 border border-orange-300', // High
            3: 'bg-red-100 text-red-700 border border-red-300', // Critical
            4: 'bg-purple-100 text-purple-700 border border-purple-300', // Emergency
        };
        return colorMap[priority] || colorMap[0];
    }

    // Helper method for detailed tooltip information
    getTicketTooltip(ticket: Ticket): string {
        const priority = this.getPriorityLabel(ticket.priority);
        const status = ticket.status_name;
        const assignedTo = this.getAssignedName(ticket);
        const requester = this.getRequesterName(ticket);
        
        return `Ticket: ${ticket.subject_issue}\nPriority: ${priority}\nStatus: ${status}\nRequester: ${requester}\nAssigned to: ${assignedTo}`;
    }

    // Helper method for description tooltip with length info
    getDescriptionTooltip(description: string): string {
        const length = description.length;
        return `${description}\n\n(${length} characters)`;
    }
}
