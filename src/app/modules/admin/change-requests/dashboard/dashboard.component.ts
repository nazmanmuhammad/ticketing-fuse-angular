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

type Status = 'OPEN' | 'INPROGRESS' | 'CLOSED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface ChangeRequest {
    id: number;
    code: string;
    requester: string;
    resource: string;
    resourceType: string;
    priority: Priority;
    status: Status;
    requestDate: string;
}

@Component({
    selector: 'app-change-requests-dashboard',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule, 
        NgApexchartsModule,
        MatSelectModule,
        MatOptionModule,
        MatFormFieldModule,
        MatInputModule
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
export class ChangeRequestsDashboardComponent {
    filterOpen = false;
    selectedPeriod = 'this_month';
    startDate = '2026-02-01';
    endDate = '2026-02-28';

    periods = [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'this_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'This Year', value: 'this_year' },
        { label: 'Custom Range', value: 'custom' },
    ];

    years = ['2022', '2023', '2024', '2025', '2026'];
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
    selectedYear = new Date().getFullYear().toString();
    selectedMonth = new Date().getMonth() + 1;

    requests: ChangeRequest[] = [
        {
            id: 1,
            code: '#CR-0001',
            requester: 'Alice',
            resource: 'Sed ut perspiciatis unde omnis iste',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'HIGH',
            status: 'INPROGRESS',
            requestDate: '01 May 2024',
        },
        {
            id: 2,
            code: '#CR-0002',
            requester: 'Jonathan',
            resource: 'Xtreme theme dropdown issue',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'MEDIUM',
            status: 'OPEN',
            requestDate: '03 May 2024',
        },
        {
            id: 3,
            code: '#CR-0003',
            requester: 'Smith',
            resource: 'Header issue in material admin',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'LOW',
            status: 'CLOSED',
            requestDate: '02 May 2024',
        },
        {
            id: 4,
            code: '#CR-0004',
            requester: 'Vincent',
            resource: 'Sidebar issue in Nice admin',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'HIGH',
            status: 'INPROGRESS',
            requestDate: '02 May 2024',
        },
        {
            id: 5,
            code: '#CR-0005',
            requester: 'Chris',
            resource: 'Elegant Theme Side Menu show OnClick',
            resourceType: 'ab illo inventore veritatis et qua...',
            priority: 'MEDIUM',
            status: 'OPEN',
            requestDate: '04 May 2024',
        },
        {
            id: 6,
            code: '#CR-0006',
            requester: 'Diana',
            resource: 'Production hotfix deployment request',
            resourceType: 'High urgency change request',
            priority: 'CRITICAL',
            status: 'OPEN',
            requestDate: '05 May 2024',
        },
    ];

    stats = [
        {
            title: 'Created',
            value: String(this.requests.length),
            trend: '+7.2%',
            up: true,
            bg: 'bg-orange-100',
            icon: 'text-orange-500',
        },
        {
            title: 'Open',
            value: String(this.countByStatus('OPEN')),
            trend: '+2.1%',
            up: true,
            bg: 'bg-blue-100',
            icon: 'text-blue-500',
        },
        {
            title: 'In Progress',
            value: String(this.countByStatus('INPROGRESS')),
            trend: '+1.4%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
        },
        {
            title: 'Closed',
            value: String(this.countByStatus('CLOSED')),
            trend: '-3.0%',
            up: false,
            bg: 'bg-teal-100',
            icon: 'text-teal-500',
        },
        {
            title: 'High Priority',
            value: String(this.countByPriority('HIGH')),
            trend: '+3.0%',
            up: true,
            bg: 'bg-amber-100',
            icon: 'text-amber-600',
        },
        {
            title: 'Critical',
            value: String(this.countByPriority('CRITICAL')),
            trend: '+0.5%',
            up: true,
            bg: 'bg-red-100',
            icon: 'text-red-500',
        },
    ];

    lineChartSeries: ApexAxisChartSeries = [
        { name: 'Open', data: [10, 12, 15, 14, 18, 20, 22, 21, 24] },
        { name: 'In Progress', data: [6, 7, 8, 9, 10, 12, 13, 12, 14] },
        { name: 'Closed', data: [4, 5, 6, 7, 8, 9, 10, 11, 12] },
        { name: 'Critical', data: [0, 0, 1, 0, 1, 1, 2, 1, 2] },
    ];

    lineChartOptions: ApexChart = {
        type: 'line',
        height: 230,
        toolbar: { show: false },
        zoom: { enabled: false },
    };

    lineChartXAxis: ApexXAxis = {
        categories: [
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
            'Jan',
            'Feb',
            'Mar',
            'Apr',
        ],
        labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
    };

    lineChartStroke: ApexStroke = {
        curve: 'smooth',
        width: 2.5,
    };

    lineChartColors = ['#3b82f6', '#6366f1', '#14b8a6', '#ef4444'];

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

    donutSeries: ApexNonAxisChartSeries = [0, 0, 0, 0];
    donutOptions: ApexChart = {
        type: 'donut',
        height: 260,
        toolbar: { show: false },
    };
    donutColors = ['#ef4444', '#f97316', '#3b82f6', '#22c55e'];
    donutLabels = ['Critical', 'High', 'Medium', 'Low'];
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
                        label: 'Total',
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

    priorityItems: Array<{ label: string; count: string; color: string }> = [];
    criticalBadgeText = '0% Critical Change Requests';

    activities: Array<{
        id: string;
        subject: string;
        status: string;
        statusColor: string;
        priority: string;
        priorityColor: string;
        requester: string;
        time: string;
    }> = [];

    constructor() {
        this.updatePriorityBreakdown();
        this.activities = this.buildActivities();
    }

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    onYearChange(): void {
        const y = Number(this.selectedYear);
        const m = this.selectedMonth;
        if (!isNaN(y) && m >= 1 && m <= 12) {
            this.startDate = `${y}-${String(m).padStart(2, '0')}-01`;
            this.endDate = new Date(y, m, 0).toISOString().split('T')[0];
        }
    }

    onMonthChange(): void {
        const y = Number(this.selectedYear);
        const m = this.selectedMonth;
        if (!isNaN(y) && m >= 1 && m <= 12) {
            this.startDate = `${y}-${String(m).padStart(2, '0')}-01`;
            this.endDate = new Date(y, m, 0).toISOString().split('T')[0];
        }
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
                const mon = new Date(now.setDate(diff));
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

    resetFilter(): void {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        this.selectedYear = String(y);
        this.selectedMonth = m;
        this.startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        this.endDate = new Date(y, m, 0).toISOString().split('T')[0];
    }

    applyFilter(): void {
        const y = Number(this.selectedYear);
        const m = this.selectedMonth;
        this.startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        this.endDate = new Date(y, m, 0).toISOString().split('T')[0];
    }

    private countByStatus(status: Status): number {
        return this.requests.filter((r) => r.status === status).length;
    }

    private countByPriority(priority: Priority): number {
        return this.requests.filter((r) => r.priority === priority).length;
    }

    private updatePriorityBreakdown(): void {
        const critical = this.countByPriority('CRITICAL');
        const high = this.countByPriority('HIGH');
        const medium = this.countByPriority('MEDIUM');
        const low = this.countByPriority('LOW');

        this.donutSeries = [critical, high, medium, low];

        const total = critical + high + medium + low;
        const pct = (value: number) =>
            total === 0 ? 0 : Math.round((value / total) * 100);

        this.criticalBadgeText = `${pct(critical)}% Critical Change Requests`;

        this.priorityItems = [
            { label: `${pct(critical)}% Critical`, count: String(critical), color: '#ef4444' },
            { label: `${pct(high)}% High`, count: String(high), color: '#f97316' },
            { label: `${pct(medium)}% Medium`, count: String(medium), color: '#3b82f6' },
            { label: `${pct(low)}% Low`, count: String(low), color: '#22c55e' },
        ];
    }

    private buildActivities(): Array<{
        id: string;
        subject: string;
        status: string;
        statusColor: string;
        priority: string;
        priorityColor: string;
        requester: string;
        time: string;
    }> {
        const statusColorMap: Record<Status, { label: string; color: string }> = {
            OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-700' },
            INPROGRESS: {
                label: 'In Progress',
                color: 'bg-orange-100 text-orange-700',
            },
            CLOSED: { label: 'Closed', color: 'bg-emerald-100 text-emerald-700' },
        };

        const priorityColorMap: Record<
            Priority,
            { label: string; color: string }
        > = {
            CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
            HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
            MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
            LOW: { label: 'Low', color: 'bg-sky-100 text-sky-700' },
        };

        const times = [
            '2 min ago',
            '10 min ago',
            '1 hour ago',
            '2 hours ago',
            '5 hours ago',
            '1 day ago',
        ];

        return this.requests.slice(0, 6).map((r, idx) => ({
            id: r.code,
            subject: r.resource,
            status: statusColorMap[r.status].label,
            statusColor: statusColorMap[r.status].color,
            priority: priorityColorMap[r.priority].label,
            priorityColor: priorityColorMap[r.priority].color,
            requester: r.requester,
            time: times[idx] ?? 'recently',
        }));
    }
}
