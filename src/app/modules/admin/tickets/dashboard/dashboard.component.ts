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
import { TicketService } from '../ticket.service';
import { UserService } from 'app/core/user/user.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-dashboard',
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
export class DashboardComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    
    // Filter state
    filterOpen = false;
    searchQuery = '';
    selectedMonth = new Date().getMonth() + 1; // 1-12
    selectedYear = new Date().getFullYear();
    
    // Loading states
    isLoadingStats = false;
    isLoadingTickets = false;
    isLoadingCharts = false;
    
    // User data
    currentUser: any = null;

    months = [
        { label: 'January', value: 1 },
        { label: 'February', value: 2 },
        { label: 'March', value: 3 },
        { label: 'April', value: 4 },
        { label: 'May', value: 5 },
        { label: 'June', value: 6 },
        { label: 'July', value: 7 },
        { label: 'August', value: 8 },
        { label: 'September', value: 9 },
        { label: 'October', value: 10 },
        { label: 'November', value: 11 },
        { label: 'December', value: 12 },
    ];

    years: number[] = [];

    stats = [
        {
            title: 'Created',
            value: '0',
            trend: '+0%',
            up: true,
            bg: 'bg-orange-100',
            icon: 'text-orange-500',
        },
        {
            title: 'Closed',
            value: '0',
            trend: '+0%',
            up: false,
            bg: 'bg-teal-100',
            icon: 'text-teal-500',
        },
        {
            title: 'Reopened',
            value: '0',
            trend: '+0%',
            up: true,
            bg: 'bg-blue-100',
            icon: 'text-blue-500',
        },
        {
            title: 'Assigned',
            value: '0',
            trend: '+0%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
        },
        {
            title: 'Transferred',
            value: '0',
            trend: '+0%',
            up: true,
            bg: 'bg-purple-100',
            icon: 'text-purple-500',
        },
        {
            title: 'Overdue',
            value: '0',
            trend: '+0%',
            up: true,
            bg: 'bg-red-100',
            icon: 'text-red-500',
        },
    ];

    constructor(
        private _translocoService: TranslocoService,
        private _ticketService: TicketService,
        private _userService: UserService
    ) {
        // Generate years (current year and 5 years back)
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 6; i++) {
            this.years.push(currentYear - i);
        }
    }

    ngOnInit(): void {
        // Get current user
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: any) => {
                this.currentUser = user;
                // Load data after user is available
                this.loadDashboardData();
            });

        // Update translations when language changes
        this._translocoService.langChanges$.subscribe(() => {
            this.updateTranslations();
        });

        // Initial translation load
        this.updateTranslations();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
    
    loadDashboardData(): void {
        if (!this.currentUser) return;
        
        this.loadStatistics();
        this.loadRecentTickets();
    }
    
    loadStatistics(): void {
        this.isLoadingStats = true;
        this.isLoadingCharts = true;
        
        const params: any = {
            role: this.currentUser.role,
            month: this.selectedMonth,
            year: this.selectedYear,
        };
        
        // Add role-specific params
        if (this.currentUser.role === 'agent') {
            params.pic_helpdesk_id = this.currentUser.id;
        } else if (this.currentUser.role === 'technical') {
            params.pic_id = this.currentUser.id;
        } else if (this.currentUser.role === 'user') {
            params.requester_id = this.currentUser.id; // Use me-validation ID, not hris_user_id
        }
        
        this._ticketService.getStatistics(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: any) => {
                    if (response.status && response.data) {
                        const data = response.data;
                        const comparison = data.comparison || {};
                        
                        // Helper to determine if trend is up or down
                        const isUp = (trend: string) => trend.startsWith('+');
                        
                        // Update stats with real data and month-over-month comparison
                        this.stats[0].value = data.created_this_month?.toString() || '0';
                        this.stats[0].trend = comparison.created || '0%';
                        this.stats[0].up = isUp(comparison.created || '0');
                        
                        this.stats[1].value = data.closed_this_month?.toString() || '0';
                        this.stats[1].trend = comparison.closed || '0%';
                        this.stats[1].up = isUp(comparison.closed || '0');
                        
                        this.stats[2].value = data.reopened?.toString() || '0';
                        this.stats[2].trend = comparison.reopened || '0%';
                        this.stats[2].up = isUp(comparison.reopened || '0');
                        
                        this.stats[3].value = data.open?.toString() || '0';
                        this.stats[3].trend = '0%'; // Open doesn't have comparison (it's current state)
                        this.stats[3].up = true;
                        
                        this.stats[4].value = data.transferred?.toString() || '0';
                        this.stats[4].trend = comparison.transferred || '0%';
                        this.stats[4].up = isUp(comparison.transferred || '0');
                        
                        this.stats[5].value = data.overdue?.toString() || '0';
                        this.stats[5].trend = comparison.overdue || '0%';
                        this.stats[5].up = isUp(comparison.overdue || '0');
                        
                        // Update line chart with trends data
                        if (data.trends) {
                            this.lineChartXAxis = {
                                ...this.lineChartXAxis,
                                categories: data.trends.months || []
                            };
                            
                            this.lineChartSeries = [
                                { 
                                    name: this._translocoService.translate('DASHBOARD.STATS.CREATED'), 
                                    data: data.trends.created || [] 
                                },
                                { 
                                    name: this._translocoService.translate('DASHBOARD.STATS.ASSIGNED'), 
                                    data: data.trends.assigned || [] 
                                },
                                { 
                                    name: this._translocoService.translate('DASHBOARD.STATS.CLOSED'), 
                                    data: data.trends.closed || [] 
                                },
                                { 
                                    name: this._translocoService.translate('DASHBOARD.STATS.OVERDUE'), 
                                    data: data.trends.overdue || [] 
                                },
                                { 
                                    name: this._translocoService.translate('DASHBOARD.STATS.REOPENED'), 
                                    data: data.trends.reopened || [] 
                                },
                                { 
                                    name: this._translocoService.translate('DASHBOARD.STATS.TRANSFERRED'), 
                                    data: data.trends.transferred || [] 
                                },
                            ];
                        }
                        
                        // Update donut chart with priority data
                        if (data.priority) {
                            this.donutSeries = [
                                data.priority.emergency || 0,
                                data.priority.high || 0,
                                data.priority.medium || 0,
                                data.priority.low || 0
                            ];
                            
                            // Update priority items
                            this.priorityItems = [
                                { 
                                    label: `${this.donutPercentAt(0)}% Emergency`, 
                                    count: data.priority.emergency?.toString().padStart(3, '0') || '000', 
                                    color: '#ef4444' 
                                },
                                { 
                                    label: `${this.donutPercentAt(1)}% High`, 
                                    count: data.priority.high?.toString().padStart(3, '0') || '000', 
                                    color: '#f97316' 
                                },
                                { 
                                    label: `${this.donutPercentAt(2)}% Medium`, 
                                    count: data.priority.medium?.toString().padStart(3, '0') || '000', 
                                    color: '#3b82f6' 
                                },
                                { 
                                    label: `${this.donutPercentAt(3)}% Low`, 
                                    count: data.priority.low?.toString().padStart(3, '0') || '000', 
                                    color: '#22c55e' 
                                },
                            ];
                        }
                    }
                    this.isLoadingStats = false;
                    this.isLoadingCharts = false;
                },
                error: (error) => {
                    console.error('Error loading statistics:', error);
                    this.isLoadingStats = false;
                    this.isLoadingCharts = false;
                }
            });
    }
    
    loadRecentTickets(): void {
        this.isLoadingTickets = true;
        
        const params: any = {
            role: this.currentUser.role,
            user_id: this.currentUser.id,
            per_page: 8,
            page: 1,
            month: this.selectedMonth,
            year: this.selectedYear,
        };
        
        this._ticketService.getTickets(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: any) => {
                    if (response.status && response.data) {
                        this.activities = response.data.map((ticket: any) => ({
                            id: ticket.ticket_number,
                            subject: ticket.subject_issue,
                            status: this.getStatusLabel(ticket.status),
                            statusColor: this.getStatusColor(ticket.status),
                            priority: this.getPriorityLabel(ticket.priority),
                            priorityColor: this.getPriorityColor(ticket.priority),
                            assignee: ticket.pic_technical?.name || ticket.pic_helpdesk?.name || '-',
                            time: this.getRelativeTime(ticket.created_at),
                        }));
                    }
                    this.isLoadingTickets = false;
                },
                error: (error) => {
                    console.error('Error loading tickets:', error);
                    this.isLoadingTickets = false;
                }
            });
    }
    
    getStatusLabel(status: number): string {
        const labels: any = {
            0: 'Pending',
            1: 'Process',
            2: 'Resolved',
            3: 'Closed'
        };
        return labels[status] || 'Unknown';
    }
    
    getStatusColor(status: number): string {
        const colors: any = {
            0: 'bg-blue-100 text-blue-700',
            1: 'bg-orange-100 text-orange-700',
            2: 'bg-purple-100 text-purple-700',
            3: 'bg-emerald-100 text-emerald-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    }
    
    getPriorityLabel(priority: number | null): string {
        if (priority === null || priority === undefined) {
            return this._translocoService.translate('TICKETS.PRIORITY.NOT_ASSIGNED');
        }
        const labels: any = {
            0: this._translocoService.translate('TICKETS.PRIORITY.LOW'),
            1: this._translocoService.translate('TICKETS.PRIORITY.MEDIUM'),
            2: this._translocoService.translate('TICKETS.PRIORITY.HIGH'),
            3: this._translocoService.translate('TICKETS.PRIORITY.CRITICAL'),
            4: this._translocoService.translate('TICKETS.PRIORITY.EMERGENCY')
        };
        return labels[priority] || this._translocoService.translate('TICKETS.PRIORITY.LOW');
    }
    
    getPriorityColor(priority: number): string {
        const colors: any = {
            1: 'bg-sky-100 text-sky-700',
            2: 'bg-yellow-100 text-yellow-700',
            3: 'bg-orange-100 text-orange-700',
            4: 'bg-red-100 text-red-700'
        };
        return colors[priority] || 'bg-gray-100 text-gray-700';
    }
    
    getRelativeTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    
    getTrendPercentage(trend: string): number {
        // Remove %, +, - signs and convert to number
        const cleaned = trend.replace('%', '').replace('+', '').replace('-', '');
        const value = parseFloat(cleaned);
        return isNaN(value) ? 0 : Math.abs(value);
    }
    
    getSkeletonMonths(): number[] {
        // If selected year is current year, show skeleton up to current month
        // Otherwise show 12 months
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12
        
        const monthCount = (this.selectedYear === currentYear) ? currentMonth : 12;
        return Array.from({ length: monthCount }, (_, i) => i + 1);
    }

    private updateTranslations(): void {
        // Update months
        this.months = [
            { label: this._translocoService.translate('MONTHS.JANUARY'), value: 1 },
            { label: this._translocoService.translate('MONTHS.FEBRUARY'), value: 2 },
            { label: this._translocoService.translate('MONTHS.MARCH'), value: 3 },
            { label: this._translocoService.translate('MONTHS.APRIL'), value: 4 },
            { label: this._translocoService.translate('MONTHS.MAY'), value: 5 },
            { label: this._translocoService.translate('MONTHS.JUNE'), value: 6 },
            { label: this._translocoService.translate('MONTHS.JULY'), value: 7 },
            { label: this._translocoService.translate('MONTHS.AUGUST'), value: 8 },
            { label: this._translocoService.translate('MONTHS.SEPTEMBER'), value: 9 },
            { label: this._translocoService.translate('MONTHS.OCTOBER'), value: 10 },
            { label: this._translocoService.translate('MONTHS.NOVEMBER'), value: 11 },
            { label: this._translocoService.translate('MONTHS.DECEMBER'), value: 12 },
        ];

        // Update stats
        this.stats = [
            {
                title: this._translocoService.translate('DASHBOARD.STATS.CREATED'),
                value: '0',
                trend: '0%',
                up: true,
                bg: 'bg-orange-100',
                icon: 'text-orange-500',
            },
            {
                title: this._translocoService.translate('DASHBOARD.STATS.CLOSED'),
                value: '0',
                trend: '0%',
                up: false,
                bg: 'bg-teal-100',
                icon: 'text-teal-500',
            },
            {
                title: this._translocoService.translate('DASHBOARD.STATS.REOPENED'),
                value: '0',
                trend: '0%',
                up: true,
                bg: 'bg-blue-100',
                icon: 'text-blue-500',
            },
            {
                title: this._translocoService.translate('DASHBOARD.STATS.ASSIGNED'),
                value: '0',
                trend: '0%',
                up: true,
                bg: 'bg-indigo-100',
                icon: 'text-indigo-500',
            },
            {
                title: this._translocoService.translate('DASHBOARD.STATS.TRANSFERRED'),
                value: '0',
                trend: '0%',
                up: true,
                bg: 'bg-purple-100',
                icon: 'text-purple-500',
            },
            {
                title: this._translocoService.translate('DASHBOARD.STATS.OVERDUE'),
                value: '0',
                trend: '0%',
                up: true,
                bg: 'bg-red-100',
                icon: 'text-red-500',
            },
        ];

        // Update donut chart labels
        this.donutLabels = [
            this._translocoService.translate('DASHBOARD.PRIORITY.EMERGENCY'),
            this._translocoService.translate('DASHBOARD.PRIORITY.HIGH'),
            this._translocoService.translate('DASHBOARD.PRIORITY.MEDIUM'),
            this._translocoService.translate('DASHBOARD.PRIORITY.LOW'),
        ];

        // Update line chart series
        this.lineChartSeries = [
            { name: this._translocoService.translate('DASHBOARD.STATS.CREATED'), data: [30, 45, 38, 55, 48, 62, 70, 65, 80, 75, 85, 90] },
            { name: this._translocoService.translate('DASHBOARD.STATS.ASSIGNED'), data: [20, 35, 28, 42, 38, 50, 58, 52, 65, 60, 70, 75] },
            { name: this._translocoService.translate('DASHBOARD.STATS.CLOSED'), data: [15, 28, 20, 35, 30, 42, 48, 44, 55, 50, 60, 65] },
            { name: this._translocoService.translate('DASHBOARD.STATS.OVERDUE'), data: [10, 18, 14, 22, 18, 28, 32, 30, 38, 35, 40, 45] },
            { name: this._translocoService.translate('DASHBOARD.STATS.REOPENED'), data: [5, 10, 8, 12, 10, 15, 18, 16, 20, 18, 22, 25] },
            { name: this._translocoService.translate('DASHBOARD.STATS.TRANSFERRED'), data: [3, 6, 5, 8, 6, 10, 12, 11, 14, 12, 15, 18] },
        ];

        // Update donut chart total label
        this.donutPlotOptions = {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: this._translocoService.translate('DASHBOARD.CHARTS.TOTAL'),
                            fontSize: '13px',
                            color: '#94a3b8',
                            formatter: (w) => {
                                return w.globals.seriesTotals
                                    .reduce((a: number, b: number) => a + b, 0)
                                    .toLocaleString();
                            },
                        },
                    },
                },
            },
        };
        
        // Reload data if user is available
        if (this.currentUser) {
            this.loadDashboardData();
        }
    }

    // LINE CHART
    lineChartSeries: ApexAxisChartSeries = [
        { name: 'Created', data: [30, 45, 38, 55, 48, 62, 70, 65, 80, 75, 85, 90] },
        { name: 'Assigned', data: [20, 35, 28, 42, 38, 50, 58, 52, 65, 60, 70, 75] },
        { name: 'Closed', data: [15, 28, 20, 35, 30, 42, 48, 44, 55, 50, 60, 65] },
        { name: 'Overdue', data: [10, 18, 14, 22, 18, 28, 32, 30, 38, 35, 40, 45] },
        { name: 'Reopened', data: [5, 10, 8, 12, 10, 15, 18, 16, 20, 18, 22, 25] },
        { name: 'Transferred', data: [3, 6, 5, 8, 6, 10, 12, 11, 14, 12, 15, 18] },
    ];

    lineChartOptions: ApexChart = {
        type: 'line',
        height: 230,
        toolbar: { show: false },
        zoom: { enabled: false },
    };

    lineChartXAxis: ApexXAxis = {
        categories: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ],
        labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
    };

    lineChartStroke: ApexStroke = {
        curve: 'smooth',
        width: 2.5,
    };

    lineChartColors = [
        '#f97316',
        '#6366f1',
        '#14b8a6',
        '#ef4444',
        '#a855f7',
        '#3b82f6',
    ];

    lineChartDataLabels: ApexDataLabels = { enabled: false };

    lineChartLegend: ApexLegend = {
        position: 'top',
        fontSize: '11px',
        markers: {
            shape: 'circle', // 'circle' | 'square' | 'line' | 'plus' | 'cross' | 'star' | 'diamond' | 'triangle'
            offsetX: 0,
            offsetY: 0,
        },
    };

    lineChartTooltip: ApexTooltip = { shared: true, intersect: false };

    // DONUT CHART
    donutSeries: ApexNonAxisChartSeries = [141, 523, 682, 52];

    donutOptions: ApexChart = {
        type: 'donut',
        height: 260,
        toolbar: { show: false },
    };

    donutColors = ['#ef4444', '#f97316', '#3b82f6', '#22c55e'];

    donutLabels = ['Emergency', 'High', 'Medium', 'Low'];

    donutDataLabels: ApexDataLabels = { enabled: false };

    donutLegend: ApexLegend = { show: false };

    donutPlotOptions: ApexPlotOptions = {
        pie: {
            donut: {
                size: '70%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: this._translocoService.translate('DASHBOARD.CHARTS.TOTAL'),
                        fontSize: '13px',
                        color: '#94a3b8',
                        formatter: (w) => {
                            return w.globals.seriesTotals
                                .reduce((a: number, b: number) => a + b, 0)
                                .toLocaleString();
                        },
                    },
                },
            },
        },
    };

    priorityItems = [
        { label: '1% Emergency', count: '141', color: '#ef4444' },
        { label: '25% High', count: '523', color: '#f97316' },
        { label: '46% Medium', count: '682', color: '#3b82f6' },
        { label: '20% Low', count: '052', color: '#22c55e' },
    ];

    get donutTotal(): number {
        return (this.donutSeries as number[]).reduce((a, b) => a + b, 0);
    }

    donutPercentAt(index: number): number {
        const series = this.donutSeries as number[];
        const total = this.donutTotal;
        if (!total || index < 0 || index >= series.length) {
            return 0;
        }
        return Math.round((series[index] / total) * 100);
    }

    activities = [
        {
            id: '#TKT-2451',
            subject: 'Login page not working on mobile',
            status: 'Closed',
            statusColor: 'bg-emerald-100 text-emerald-700',
            priority: 'Critical',
            priorityColor: 'bg-red-100 text-red-700',
            assignee: '-',
            time: '2 min ago',
        },
        {
            id: '#TKT-2450',
            subject: 'Payment gateway timeout issue',
            status: 'Created',
            statusColor: 'bg-blue-100 text-blue-700',
            priority: 'Low',
            priorityColor: 'bg-sky-100 text-sky-700',
            assignee: 'Jane Smith',
            time: '10 min ago',
        },
        {
            id: '#TKT-2448',
            subject: 'Email notification not received',
            status: 'Reopened',
            statusColor: 'bg-orange-100 text-orange-700',
            priority: 'Medium',
            priorityColor: 'bg-yellow-100 text-yellow-700',
            assignee: 'Mike Johnson',
            time: '1 hour ago',
        },
        {
            id: '#TKT-2442',
            subject: 'Dashboard performance slow',
            status: 'Transferred',
            statusColor: 'bg-purple-100 text-purple-700',
            priority: 'Low',
            priorityColor: 'bg-sky-100 text-sky-700',
            assignee: 'Sarah Wilson',
            time: '2 hours ago',
        },
        {
            id: '#TKT-2038',
            subject: 'Network connection error',
            status: 'Overdue',
            statusColor: 'bg-red-100 text-red-700',
            priority: 'High',
            priorityColor: 'bg-orange-100 text-orange-700',
            assignee: 'David Brown',
            time: '3 days ago',
        },
        {
            id: '#TKT-2449',
            subject: 'API endpoint returning 500 error',
            status: 'Resolved',
            statusColor: 'bg-emerald-100 text-emerald-700',
            priority: 'High',
            priorityColor: 'bg-orange-100 text-orange-700',
            assignee: 'Anna Davis',
            time: '30 min ago',
        },
        {
            id: '#TKT-2447',
            subject: 'User profile update not saving',
            status: 'Closed',
            statusColor: 'bg-emerald-100 text-emerald-700',
            priority: 'Medium',
            priorityColor: 'bg-yellow-100 text-yellow-700',
            assignee: 'Shawn Taylor',
            time: '6 hours ago',
        },
        {
            id: '#TKT-2440',
            subject: 'File upload size limit exceeded',
            status: 'Created',
            statusColor: 'bg-blue-100 text-blue-700',
            priority: 'Low',
            priorityColor: 'bg-sky-100 text-sky-700',
            assignee: 'Lisa Anderson',
            time: '5 hours ago',
        },
    ];

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    applyFilter(): void {
        console.log('Filter:', this.selectedMonth, this.selectedYear);
        // Reload data with filter
        this.loadDashboardData();
    }

    resetFilter(): void {
        this.selectedMonth = new Date().getMonth() + 1;
        this.selectedYear = new Date().getFullYear();
        this.loadDashboardData();
    }
}
