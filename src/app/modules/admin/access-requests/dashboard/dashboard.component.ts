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
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexDataLabels,
    ApexLegend,
    ApexNonAxisChartSeries,
    ApexPlotOptions,
    ApexStroke,
    ApexTooltip,
    ApexXAxis,
    NgApexchartsModule,
} from 'ng-apexcharts';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AccessRequestService } from '../access-request.service';
import { UserService } from 'app/core/user/user.service';

@Component({
    selector: 'app-access-request-dashboard',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule, 
        NgApexchartsModule,
        MatSelectModule,
        MatOptionModule,
        MatFormFieldModule,
        MatInputModule,
        TranslocoModule
    ],
    templateUrl: './dashboard.component.html',
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
export class AccessRequestDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    
    // Loading state
    isLoading = false;
    
    // Current user
    currentUser: any = null;
    
    // Filter state
    filterOpen = false;
    selectedPeriod = 'this_month';
    selectedMonth = new Date().getMonth() + 1; // 1-12
    selectedYear = new Date().getFullYear();
    startDate = '';
    endDate = '';

    periods = [];

    stats = [
        {
            title: 'Loading...',
            value: '0',
            trend: '0%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
        },
        {
            title: 'Loading...',
            value: '0',
            trend: '0%',
            up: true,
            bg: 'bg-yellow-100',
            icon: 'text-yellow-600',
        },
        {
            title: 'Loading...',
            value: '0',
            trend: '0%',
            up: true,
            bg: 'bg-green-100',
            icon: 'text-green-600',
        },
        {
            title: 'Loading...',
            value: '0',
            trend: '0%',
            up: true,
            bg: 'bg-red-100',
            icon: 'text-red-600',
        },
        {
            title: 'Loading...',
            value: '0',
            trend: '0%',
            up: true,
            bg: 'bg-gray-100',
            icon: 'text-gray-600',
        },
    ];

    // Recent requests
    recentRequests: any[] = [];

    // LINE CHART
    lineChartSeries: ApexAxisChartSeries = [
        { name: 'Pending', data: [0] },
        { name: 'Approved', data: [0] },
        { name: 'Rejected', data: [0] },
    ];

    lineChartOptions: ApexChart = {
        type: 'line',
        height: 230,
        toolbar: { show: false },
        zoom: { enabled: false },
    };

    lineChartXAxis: ApexXAxis = {
        categories: ['Loading...'],
        labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
    };

    lineChartStroke: ApexStroke = {
        curve: 'smooth',
        width: 2.5,
    };

    lineChartColors = [
        '#6366f1',
        '#10b981',
        '#ef4444',
    ];

    lineChartDataLabels: ApexDataLabels = { enabled: false };

    lineChartLegend: ApexLegend = {
        position: 'top',
        fontSize: '11px',
        markers: {
            shape: 'circle',
            offsetX: 0,
            offsetY: 0,
        },
    };

    lineChartTooltip: ApexTooltip = { shared: true, intersect: false };

    // DONUT CHART
    donutSeries: ApexNonAxisChartSeries = [0, 0, 0];

    donutOptions: ApexChart = {
        type: 'donut',
        height: 260,
        toolbar: { show: false },
    };

    donutColors = ['#f59e0b', '#10b981', '#ef4444'];

    donutLabels = ['Pending', 'Approved', 'Rejected'];

    donutDataLabels: ApexDataLabels = { enabled: false };

    donutLegend: ApexLegend = { show: false };

    donutPlotOptions: ApexPlotOptions = {
        pie: {
            donut: {
                size: '75%',
                labels: {
                    show: true,
                    name: {
                        show: true,
                        fontSize: '12px',
                        color: '#64748b',
                        offsetY: -5,
                    },
                    value: {
                        show: true,
                        fontSize: '24px',
                        fontWeight: 600,
                        color: '#0f172a',
                        offsetY: 5,
                        formatter: (val) => {
                            // Calculate percentage
                            const numVal = typeof val === 'string' ? parseFloat(val) : val;
                            return numVal.toFixed(0) + '%';
                        },
                    },
                    total: {
                        show: true,
                        label: 'Total',
                        color: '#64748b',
                        formatter: (w) => {
                            return w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0);
                        },
                    },
                },
            },
        },
    };

    constructor(
        private _translocoService: TranslocoService,
        private _accessRequestService: AccessRequestService,
        private _userService: UserService
    ) {}

    ngOnInit(): void {
        // Get current user
        this._userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
            this.currentUser = user;
            // Load statistics after getting user
            this.loadStatistics();
        });

        // Wait for translations to load
        this._translocoService.events$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
            if (event.type === 'translationLoadSuccess') {
                this.updateTranslations();
            }
        });

        // Update translations when language changes
        this._translocoService.langChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.updateTranslations();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadStatistics(): void {
        if (!this.currentUser) return;

        this.isLoading = true;

        const params: any = {
            month: this.selectedMonth,
            year: this.selectedYear,
        };

        // Add role-based filtering
        if (this.currentUser.role === 'Agent' || this.currentUser.role === 'Technical') {
            params.role = this.currentUser.role.toLowerCase();
            params.user_id = this.currentUser.id;
            // Add team_id if user has teams
        } else if (this.currentUser.role === 'User') {
            params.role = 'user';
            params.requester_id = this.currentUser.id;
        }

        this._accessRequestService.getStatistics(params)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response) => {
                    if (response.status && response.data) {
                        this.updateDashboardData(response.data);
                    }
                },
                error: (error) => {
                    console.error('Error loading statistics:', error);
                }
            });
    }

    private updateDashboardData(data: any): void {
        // Update stats cards
        this.stats = [
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.NEW_TODAY'),
                value: data.new_today?.toString() || '0',
                trend: data.comparison?.created || '0%',
                up: data.comparison?.created?.startsWith('+') || false,
                bg: 'bg-indigo-100',
                icon: 'text-indigo-500',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.PENDING_APPROVAL'),
                value: data.pending?.toString() || '0',
                trend: '0%',
                up: true,
                bg: 'bg-yellow-100',
                icon: 'text-yellow-600',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.APPROVED'),
                value: data.approved?.toString() || '0',
                trend: data.comparison?.approved || '0%',
                up: data.comparison?.approved?.startsWith('+') || false,
                bg: 'bg-green-100',
                icon: 'text-green-600',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.REJECTED'),
                value: data.rejected?.toString() || '0',
                trend: data.comparison?.rejected || '0%',
                up: data.comparison?.rejected?.startsWith('+') || false,
                bg: 'bg-red-100',
                icon: 'text-red-600',
            },
            {
                title: this._translocoService.translate('ACCESS_REQUESTS.STATS.TOTAL'),
                value: data.created_this_month?.toString() || '0',
                trend: data.comparison?.created || '0%',
                up: data.comparison?.created?.startsWith('+') || false,
                bg: 'bg-gray-100',
                icon: 'text-gray-600',
            },
        ];

        // Update recent requests
        this.recentRequests = data.recent_requests || [];

        // Update line chart with trends data
        if (data.trends && data.trends.length > 0) {
            const months = data.trends.map((t: any) => t.month);
            const pendingData = data.trends.map((t: any) => t.pending);
            const approvedData = data.trends.map((t: any) => t.approved);
            const rejectedData = data.trends.map((t: any) => t.rejected);

            this.lineChartXAxis = {
                ...this.lineChartXAxis,
                categories: months,
            };

            this.lineChartSeries = [
                { name: this._translocoService.translate('ACCESS_REQUESTS.STATUS.PENDING'), data: pendingData },
                { name: this._translocoService.translate('ACCESS_REQUESTS.STATUS.APPROVED'), data: approvedData },
                { name: this._translocoService.translate('ACCESS_REQUESTS.STATUS.REJECTED'), data: rejectedData },
            ];
        }

        // Update donut chart
        this.donutSeries = [
            data.pending || 0,
            data.approved || 0,
            data.rejected || 0,
        ];

        this.donutLabels = [
            this._translocoService.translate('ACCESS_REQUESTS.STATUS.PENDING'),
            this._translocoService.translate('ACCESS_REQUESTS.STATUS.APPROVED'),
            this._translocoService.translate('ACCESS_REQUESTS.STATUS.REJECTED'),
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

        // Update initial chart labels
        this.lineChartSeries = [
            { name: this._translocoService.translate('ACCESS_REQUESTS.STATUS.PENDING'), data: this.lineChartSeries[0]?.data || [0] },
            { name: this._translocoService.translate('ACCESS_REQUESTS.STATUS.APPROVED'), data: this.lineChartSeries[1]?.data || [0] },
            { name: this._translocoService.translate('ACCESS_REQUESTS.STATUS.REJECTED'), data: this.lineChartSeries[2]?.data || [0] },
        ];

        this.donutLabels = [
            this._translocoService.translate('ACCESS_REQUESTS.STATUS.PENDING'),
            this._translocoService.translate('ACCESS_REQUESTS.STATUS.APPROVED'),
            this._translocoService.translate('ACCESS_REQUESTS.STATUS.REJECTED'),
        ];

        // Reload statistics only if user is already loaded
        if (this.currentUser && this.stats[0].title !== 'Loading...') {
            this.loadStatistics();
        }
    }

    toggleFilter() {
        this.filterOpen = !this.filterOpen;
    }

    resetFilter() {
        this.selectedPeriod = 'this_month';
        this.selectedMonth = new Date().getMonth() + 1;
        this.selectedYear = new Date().getFullYear();
        this.loadStatistics();
    }

    applyFilter() {
        this.loadStatistics();
    }

    onPeriodChange() {
        // Calculate month/year based on selected period
        const now = new Date();
        
        switch (this.selectedPeriod) {
            case 'today':
            case 'this_week':
            case 'this_month':
                this.selectedMonth = now.getMonth() + 1;
                this.selectedYear = now.getFullYear();
                break;
            case 'last_month':
                const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
                const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                this.selectedMonth = lastMonth;
                this.selectedYear = lastMonthYear;
                break;
            case 'this_year':
                this.selectedMonth = now.getMonth() + 1;
                this.selectedYear = now.getFullYear();
                break;
        }
        
        this.loadStatistics();
    }

    getStatusBadgeClass(status: number): string {
        const statusMap: Record<number, string> = {
            0: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
            1: 'bg-green-50 text-green-600 border border-green-200',
            2: 'bg-red-50 text-red-600 border border-red-200',
            3: 'bg-blue-50 text-blue-600 border border-blue-200',
        };
        return statusMap[status] || statusMap[0];
    }

    getPriorityBadgeClass(priority: number | null): string {
        if (priority === null || priority === undefined) {
            return 'bg-gray-50 text-gray-500 border border-gray-200';
        }
        const colorMap: Record<number, string> = {
            0: 'bg-gray-100 text-gray-700 border border-gray-300',
            1: 'bg-blue-100 text-blue-700 border border-blue-300',
            2: 'bg-orange-100 text-orange-700 border border-orange-300',
            3: 'bg-red-100 text-red-700 border border-red-300',
        };
        return colorMap[priority] || colorMap[0];
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    getPercentage(index: number): string {
        const total = this.donutSeries.reduce((sum, val) => sum + val, 0);
        if (total === 0) {
            return '0';
        }
        const percentage = (this.donutSeries[index] / total) * 100;
        return percentage.toFixed(0);
    }
}
