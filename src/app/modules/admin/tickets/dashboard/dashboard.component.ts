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
export class DashboardComponent {
    // Filter state
    filterOpen = false;
    searchQuery = '';
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

    stats = [
        {
            title: 'Created',
            value: '2,358',
            trend: '+7.2%',
            up: true,
            bg: 'bg-orange-100',
            icon: 'text-orange-500',
        },
        {
            title: 'Closed',
            value: '434',
            trend: '-6%',
            up: false,
            bg: 'bg-teal-100',
            icon: 'text-teal-500',
        },
        {
            title: 'Reopened',
            value: '2,358',
            trend: '+7.6%',
            up: true,
            bg: 'bg-blue-100',
            icon: 'text-blue-500',
        },
        {
            title: 'Assigned',
            value: '2,358',
            trend: '+7.0%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
        },
        {
            title: 'Transferred',
            value: '2,358',
            trend: '+3%',
            up: true,
            bg: 'bg-purple-100',
            icon: 'text-purple-500',
        },
        {
            title: 'Overdue',
            value: '2,358',
            trend: '+7.0%',
            up: true,
            bg: 'bg-red-100',
            icon: 'text-red-500',
        },
    ];

    // LINE CHART
    lineChartSeries: ApexAxisChartSeries = [
        { name: 'Created', data: [30, 45, 38, 55, 48, 62, 70, 65, 80] },
        { name: 'Assigned', data: [20, 35, 28, 42, 38, 50, 58, 52, 65] },
        { name: 'Closed', data: [15, 28, 20, 35, 30, 42, 48, 44, 55] },
        { name: 'Overdue', data: [10, 18, 14, 22, 18, 28, 32, 30, 38] },
        { name: 'Reopened', data: [5, 10, 8, 12, 10, 15, 18, 16, 20] },
        { name: 'Transferred', data: [3, 6, 5, 8, 6, 10, 12, 11, 14] },
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

    onPeriodChange(): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        switch (this.selectedPeriod) {
            case 'today':
                const today = now.toISOString().split('T')[0];
                this.startDate = today;
                this.endDate = today;
                break;
            case 'this_week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const mon = new Date(now.setDate(diff));
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

    applyFilter(): void {
        console.log(
            'Filter:',
            this.selectedPeriod,
            this.startDate,
            this.endDate
        );
        // TODO: integrate API
    }

    resetFilter(): void {
        this.selectedPeriod = 'this_month';
        this.onPeriodChange();
    }
}
