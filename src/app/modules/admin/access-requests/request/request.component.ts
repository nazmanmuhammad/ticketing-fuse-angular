import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { UserService } from 'app/core/user/user.service';
import { catchError, finalize, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AccessRequestService, AccessRequest } from '../access-request.service';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { ConfirmationDialogService } from 'app/core/services/confirmation-dialog.service';

@Component({
    selector: 'app-access-request-list',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule, 
        MatFormFieldModule, 
        MatInputModule, 
        MatSelectModule, 
        MatOptionModule,
        TranslocoModule
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
export class AccessRequestListComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    filterOpen = false;
    searchQuery = '';
    selectedPeriod = 'this_month';
    startDate = '2026-02-01';
    endDate = '2026-02-28';
    selectedStatus: '' | number = '';
    itemsPerPage = 10;
    currentPage = 1;
    activeTab: 'all' | 'assigned' = 'all';
    currentUser: any = null;
    isLoading = false;
    requests: AccessRequest[] = [];
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
        { label: 'Pending', value: 0 },
        { label: 'Approved', value: 1 },
        { label: 'Rejected', value: 2 },
        { label: 'Provisioned', value: 3 },
    ];

    stats: any[] = [];

    constructor(
        private router: Router,
        private _userService: UserService,
        private _translocoService: TranslocoService,
        private _accessRequestService: AccessRequestService,
        private _snackbar: SnackbarService,
        private _confirmDialog: ConfirmationDialogService
    ) {}

    ngOnInit(): void {
        // Get current user
        this._userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
            this.currentUser = user;
            // Load data after getting user
            this.loadAccessRequests();
            this.loadStatistics();
        });

        // Wait for translations to load
        this._translocoService.events$
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => {
                if (event.type === 'translationLoadSuccess') {
                    this.updateTranslations();
                }
            });

        // Update translations when language changes
        this._translocoService.langChanges$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.updateTranslations();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadAccessRequests(): void {
        if (this.isLoading) return;

        this.isLoading = true;

        const params: any = {
            page: this.currentPage,
            per_page: this.itemsPerPage,
        };

        // Add search query
        if (this.searchQuery.trim()) {
            params.search = this.searchQuery.trim();
        }

        // Add status filter
        if (this.selectedStatus !== '') {
            params.status = this.selectedStatus;
        }

        // Add requester filter for assigned tab
        if (this.activeTab === 'assigned' && this.currentUser) {
            params.requester_id = this.currentUser.id;
        }

        this._accessRequestService.getAccessRequests(params)
            .pipe(
                catchError((error) => {
                    console.error('Error loading access requests:', error);
                    this._snackbar.error('Failed to load access requests');
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this.requests = response.data || [];
                    this.totalItems = response.meta?.total || 0;
                    this.totalPages = response.meta?.last_page || 0;
                }
            });
    }

    loadStatistics(): void {
        if (!this.currentUser) return;

        const params: any = {};
        
        if (this.activeTab === 'assigned') {
            params.requester_id = this.currentUser.id;
        }

        this._accessRequestService.getStatistics(params)
            .pipe(
                catchError((error) => {
                    console.error('Error loading statistics:', error);
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    this.updateStats(response.data);
                }
            });
    }

    private updateStats(data: any): void {
        this.stats = [
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.TOTAL'),
                value: data.total || 0,
                trend: '+8%',
                up: true,
                bg: 'bg-indigo-100',
                icon: 'text-indigo-500',
                border: 'border-t-indigo-500',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.PENDING'),
                value: data.pending || 0,
                trend: '+3%',
                up: true,
                bg: 'bg-orange-100',
                icon: 'text-orange-500',
                border: 'border-t-orange-500',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.APPROVED'),
                value: data.approved || 0,
                trend: '+12%',
                up: true,
                bg: 'bg-emerald-100',
                icon: 'text-emerald-600',
                border: 'border-t-emerald-500',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.REJECTED'),
                value: data.rejected || 0,
                trend: '-1%',
                up: false,
                bg: 'bg-red-100',
                icon: 'text-red-500',
                border: 'border-t-red-500',
            },
        ];
    }

    private updateTranslations(): void {
        // Update periods
        this.periods = [
            { label: this._translocoService.translate('ACCESS_REQUESTS.FILTERS.PERIODS.TODAY'), value: 'today' },
            { label: this._translocoService.translate('ACCESS_REQUESTS.FILTERS.PERIODS.THIS_WEEK'), value: 'this_week' },
            { label: this._translocoService.translate('ACCESS_REQUESTS.FILTERS.PERIODS.THIS_MONTH'), value: 'this_month' },
            { label: this._translocoService.translate('ACCESS_REQUESTS.FILTERS.PERIODS.LAST_MONTH'), value: 'last_month' },
            { label: this._translocoService.translate('ACCESS_REQUESTS.FILTERS.PERIODS.THIS_YEAR'), value: 'this_year' },
            { label: this._translocoService.translate('ACCESS_REQUESTS.FILTERS.PERIODS.CUSTOM'), value: 'custom' },
        ];

        // Update statuses
        this.statuses = [
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.ALL'), value: '' },
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.PENDING'), value: 0 },
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.APPROVED'), value: 1 },
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.REJECTED'), value: 2 },
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.PROVISIONED'), value: 3 },
        ];
    }

    setTab(tab: 'all' | 'assigned'): void {
        this.activeTab = tab;
        this.currentPage = 1;
        this.loadAccessRequests();
        this.loadStatistics();
    }

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    resetFilter(): void {
        this.searchQuery = '';
        this.selectedPeriod = 'this_month';
        this.selectedStatus = '';
        this.startDate = '2026-02-01';
        this.endDate = '2026-02-28';
        this.currentPage = 1;
        this.loadAccessRequests();
    }

    applyFilter(): void {
        this.currentPage = 1;
        this.loadAccessRequests();
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.loadAccessRequests();
    }

    onStatusChange(): void {
        this.currentPage = 1;
        this.loadAccessRequests();
    }

    onPeriodChange(): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        switch (this.selectedPeriod) {
            case 'today': {
                const today = now.toISOString().split('T')[0];
                this.startDate = today;
                this.endDate = today;
                break;
            }
            case 'this_week': {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const mon = new Date(new Date().setDate(diff));
                const sun = new Date(mon);
                sun.setDate(mon.getDate() + 6);
                this.startDate = mon.toISOString().split('T')[0];
                this.endDate = sun.toISOString().split('T')[0];
                break;
            }
            case 'this_month': {
                this.startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                this.endDate = new Date(year, month + 1, 0)
                    .toISOString()
                    .split('T')[0];
                break;
            }
            case 'last_month': {
                const lm = month === 0 ? 11 : month - 1;
                const ly = month === 0 ? year - 1 : year;
                this.startDate = `${ly}-${String(lm + 1).padStart(2, '0')}-01`;
                this.endDate = new Date(ly, lm + 1, 0)
                    .toISOString()
                    .split('T')[0];
                break;
            }
            case 'this_year': {
                this.startDate = `${year}-01-01`;
                this.endDate = `${year}-12-31`;
                break;
            }
        }
    }

    get countAll(): number {
        return this.totalItems;
    }

    get countAssigned(): number {
        return this.totalItems;
    }

    get paginatedRequests(): AccessRequest[] {
        return this.requests;
    }

    get rangeLabel(): string {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        return `${start} - ${end} of ${this.totalItems}`;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadAccessRequests();
        }
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this.loadAccessRequests();
    }

    navigateToCreate(): void {
        this.router.navigate(['/access-requests/create']);
    }

    deleteAccessRequest(id: string): void {
        this._confirmDialog
            .confirmDelete('this access request')
            .pipe(
                switchMap((confirmed) => {
                    if (confirmed) {
                        return this._accessRequestService.deleteAccessRequest(id).pipe(
                            catchError((error) => {
                                console.error('Error deleting access request:', error);
                                this._snackbar.error(
                                    error?.error?.message ||
                                        'Failed to delete access request'
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
                    this._snackbar.success('Access request deleted successfully');
                    this.loadAccessRequests();
                    this.loadStatistics();
                }
            });
    }

    getStatusBadgeClass(status: number): string {
        const statusMap: Record<number, string> = {
            0: 'text-orange-600 bg-orange-50 border border-orange-200',
            1: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
            2: 'text-red-600 bg-red-50 border border-red-200',
            3: 'text-blue-600 bg-blue-50 border border-blue-200',
        };
        return statusMap[status] || statusMap[0];
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    onAction(request: AccessRequest): void {
        this.router.navigate(['/access-requests/detail', request.id]);
    }
}
