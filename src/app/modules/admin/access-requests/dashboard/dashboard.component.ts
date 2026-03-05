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
export class AccessRequestDashboardComponent {
    // Filter state
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

    stats = [
        {
            title: 'New Requests',
            value: '124',
            trend: '+5.2%',
            up: true,
            bg: 'bg-indigo-100',
            icon: 'text-indigo-500',
        },
        {
            title: 'Pending Approval',
            value: '45',
            trend: '-2%',
            up: false,
            bg: 'bg-orange-100',
            icon: 'text-orange-500',
        },
        {
            title: 'Approved',
            value: '890',
            trend: '+12%',
            up: true,
            bg: 'bg-emerald-100',
            icon: 'text-emerald-500',
        },
        {
            title: 'Rejected',
            value: '32',
            trend: '-5%',
            up: false,
            bg: 'bg-red-100',
            icon: 'text-red-500',
        },
        {
            title: 'Revoked',
            value: '12',
            trend: '+1%',
            up: true,
            bg: 'bg-gray-100',
            icon: 'text-gray-500',
        },
        {
            title: 'Expired',
            value: '8',
            trend: '0%',
            up: true,
            bg: 'bg-amber-100',
            icon: 'text-amber-500',
        },
    ];

    // LINE CHART
    lineChartSeries: ApexAxisChartSeries = [
        { name: 'New Requests', data: [12, 19, 15, 25, 22, 30, 35, 32, 40] },
        { name: 'Approved', data: [10, 15, 12, 20, 18, 25, 28, 26, 35] },
        { name: 'Rejected', data: [2, 4, 3, 5, 4, 5, 7, 6, 5] },
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
    donutSeries: ApexNonAxisChartSeries = [45, 30, 25];

    donutOptions: ApexChart = {
        type: 'donut',
        height: 260,
        toolbar: { show: false },
    };

    donutColors = ['#f97316', '#10b981', '#ef4444'];

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
                        formatter: (val) => val,
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

    constructor() {}

    toggleFilter() {
        this.filterOpen = !this.filterOpen;
    }

    resetFilter() {
        this.selectedPeriod = 'this_month';
        this.startDate = '2026-02-01';
        this.endDate = '2026-02-28';
    }

    applyFilter() {
        console.log(
            'Filter:',
            this.selectedPeriod,
            this.startDate,
            this.endDate
        );
    }

    onPeriodChange() {
        console.log('Period changed:', this.selectedPeriod);
    }
}
