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
    selector: 'app-job-request-dashboard',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        RouterModule, 
        NgApexchartsModule,
        MatSelectModule,
        MatOptionModule,
        MatFormFieldModule
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
export class JobRequestDashboardComponent {
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
    ];

    // Chart Options
    chartSeries: ApexAxisChartSeries = [
        {
            name: 'Job Requests',
            data: [44, 55, 57, 56, 61, 58, 63],
        },
    ];

    chartOptions: {
        series: ApexAxisChartSeries;
        chart: ApexChart;
        xaxis: ApexXAxis;
        stroke: ApexStroke;
        tooltip: ApexTooltip;
        dataLabels: ApexDataLabels;
    } = {
        series: [
            {
                name: 'Job Requests',
                data: [44, 55, 57, 56, 61, 58, 63],
            },
        ],
        chart: {
            type: 'area',
            height: 300,
            toolbar: { show: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
        tooltip: {
            theme: 'dark',
        },
    };

    pieOptions: {
        series: ApexNonAxisChartSeries;
        chart: ApexChart;
        labels: string[];
        colors: string[];
        legend: ApexLegend;
    } = {
        series: [44, 55, 13, 43],
        chart: {
            type: 'donut',
            height: 320,
        },
        labels: ['Pending', 'Approved', 'Rejected', 'Draft'],
        colors: ['#6366f1', '#10b981', '#ef4444', '#f59e0b'],
        legend: {
            position: 'bottom',
        },
    };

    toggleFilter(): void {
        this.filterOpen = !this.filterOpen;
    }

    resetFilter(): void {
        this.selectedPeriod = 'this_month';
        this.startDate = '';
        this.endDate = '';
    }
}
