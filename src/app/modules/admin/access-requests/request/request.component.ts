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
import { User } from 'app/core/user/user.types';
import { take } from 'rxjs';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AccessRequest {
    id: number;
    code: string;
    requester: string;
    avatar: string;
    resource: string;
    resourceType: string;
    status: Status;
    requestDate: string;
}

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
        { label: 'All Status', value: '' },
        { label: 'Pending', value: 'PENDING' as Status },
        { label: 'Approved', value: 'APPROVED' as Status },
        { label: 'Rejected', value: 'REJECTED' as Status },
    ];

    requests: AccessRequest[] = [
        {
            id: 1,
            code: '#AR1',
            requester: 'John Doe',
            avatar: 'J',
            resource: 'Admin Portal',
            resourceType: 'Admin Access',
            status: 'PENDING',
            requestDate: '28 Dec 2025',
        },
        {
            id: 2,
            code: '#AR2',
            requester: 'Jane Smith',
            avatar: 'J',
            resource: 'Finance System',
            resourceType: 'Read Only',
            status: 'APPROVED',
            requestDate: '27 Dec 2025',
        },
        {
            id: 3,
            code: '#AR3',
            requester: 'Mike Johnson',
            avatar: 'M',
            resource: 'HR System',
            resourceType: 'Standard User',
            status: 'REJECTED',
            requestDate: '26 Dec 2025',
        },
        {
            id: 4,
            code: '#AR4',
            requester: 'Sarah Williams',
            avatar: 'S',
            resource: 'Product Catalog',
            resourceType: 'Editor',
            status: 'APPROVED',
            requestDate: '30 Dec 2025',
        },
        {
            id: 5,
            code: '#AR5',
            requester: 'David Brown',
            avatar: 'D',
            resource: 'Analytics',
            resourceType: 'Viewer',
            status: 'PENDING',
            requestDate: '29 Dec 2025',
        },
    ];

    avatarColors: Record<string, string> = {
        J: 'bg-indigo-400',
        M: 'bg-teal-400',
        S: 'bg-purple-400',
        D: 'bg-orange-400',
    };

    statusConfig: Record<
        Status,
        { label: string; classes: string; actionIcon: 'review' | 'approved' | 'rejected' }
    > = {
        PENDING: {
            label: 'PENDING',
            classes: 'text-orange-600 bg-orange-50 border border-orange-200',
            actionIcon: 'review',
        },
        APPROVED: {
            label: 'APPROVED',
            classes: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
            actionIcon: 'approved',
        },
        REJECTED: {
            label: 'REJECTED',
            classes: 'text-red-600 bg-red-50 border border-red-200',
            actionIcon: 'rejected',
        },
    };

    stats: any[] = [];

    constructor(
        private router: Router,
        private _userService: UserService,
        private _translocoService: TranslocoService
    ) {
        this._userService.user$.pipe(take(1)).subscribe((user: User) => {
            this.currentUser = (user?.name || 'Alice').trim() || 'Alice';
        });
    }

    ngOnInit(): void {
        // Wait for translations to load
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

    ngOnDestroy(): void {}

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
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.PENDING'), value: 'PENDING' as Status },
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.APPROVED'), value: 'APPROVED' as Status },
            { label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.REJECTED'), value: 'REJECTED' as Status },
        ];

        // Update status config labels
        this.statusConfig = {
            PENDING: {
                label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.PENDING'),
                classes: 'text-orange-600 bg-orange-50 border border-orange-200',
                actionIcon: 'review',
            },
            APPROVED: {
                label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.APPROVED'),
                classes: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
                actionIcon: 'approved',
            },
            REJECTED: {
                label: this._translocoService.translate('ACCESS_REQUESTS.STATUS.REJECTED'),
                classes: 'text-red-600 bg-red-50 border border-red-200',
                actionIcon: 'rejected',
            },
        };

        // Update stats
        const total = this.requests.length;
        const pending = this.requests.filter((r) => r.status === 'PENDING').length;
        const approved = this.requests.filter((r) => r.status === 'APPROVED').length;
        const rejected = this.requests.filter((r) => r.status === 'REJECTED').length;

        this.stats = [
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.TOTAL'),
                value: total,
                trend: '+8%',
                up: true,
                bg: 'bg-indigo-100',
                icon: 'text-indigo-500',
                border: 'border-t-indigo-500',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.PENDING'),
                value: pending,
                trend: '+3%',
                up: true,
                bg: 'bg-orange-100',
                icon: 'text-orange-500',
                border: 'border-t-orange-500',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.APPROVED'),
                value: approved,
                trend: '+12%',
                up: true,
                bg: 'bg-emerald-100',
                icon: 'text-emerald-600',
                border: 'border-t-emerald-500',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.REJECTED'),
                value: rejected,
                trend: '-1%',
                up: false,
                bg: 'bg-red-100',
                icon: 'text-red-500',
                border: 'border-t-red-500',
            },
        ];
    }

    setTab(tab: 'all' | 'assigned'): void {
        this.activeTab = tab;
        this.currentPage = 1;
    }

    private isAssignedToMe(request: AccessRequest): boolean {
        return (
            !!request.requester &&
            request.requester.toLowerCase() === this.currentUser.toLowerCase()
        );
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
    }

    applyFilter(): void {
        this.currentPage = 1;
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

    get filteredRequests(): AccessRequest[] {
        const base = this.requests.filter((r) => {
            const q = this.searchQuery.toLowerCase().trim();
            const matchSearch =
                !q ||
                r.code.toLowerCase().includes(q) ||
                r.requester.toLowerCase().includes(q) ||
                r.resource.toLowerCase().includes(q);
            const matchStatus = !this.selectedStatus || r.status === this.selectedStatus;
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
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }
    get paginatedRequests(): AccessRequest[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredRequests.slice(start, start + this.itemsPerPage);
    }
    get rangeLabel(): string {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        return `${start} - ${end} of ${this.totalItems}`;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }
    onItemsPerPageChange(): void {
        this.currentPage = 1;
    }

    navigateToCreate(): void {
        this.router.navigate(['/access-requests/create']);
    }

    onAction(request: AccessRequest): void {
        console.log('Action:', request);
    }
}
