import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexStroke,
    ApexTooltip,
    ApexDataLabels,
    ApexGrid,
    ApexLegend,
    ApexPlotOptions,
    ApexYAxis,
    ApexFill
} from 'ng-apexcharts';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    tooltip: ApexTooltip;
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    yaxis: ApexYAxis;
    fill: ApexFill;
    labels: string[];
    colors: string[];
};

@Component({
    selector: 'dashboard',
    standalone: true,
    templateUrl: './dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, MatIconModule, MatButtonModule, NgApexchartsModule],
})
export class DashboardComponent {
    // Stat data
    stats = [
        {
            title: 'Total Tickets',
            value: '128',
            trend: '+12%',
            up: true,
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            icon: 'heroicons_outline:ticket',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'Access Requests',
            value: '45',
            trend: '+5%',
            up: true,
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            icon: 'heroicons_outline:key',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            title: 'Change Requests',
            value: '12',
            trend: '-2%',
            up: false,
            bg: 'bg-indigo-100 dark:bg-indigo-900/30',
            text: 'text-indigo-600 dark:text-indigo-400',
            icon: 'heroicons_outline:document-text',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            title: 'Pending Approvals',
            value: '8',
            trend: 'Urgent',
            up: false,
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-600 dark:text-red-400',
            icon: 'heroicons_outline:clock',
            iconColor: 'text-red-600 dark:text-red-400',
        },
    ];

    // Main Chart: Tickets vs Requests
    mainChartSeries: ApexAxisChartSeries = [
        {
            name: 'Tickets',
            data: [31, 40, 28, 51, 42, 109, 100],
        },
        {
            name: 'Access Requests',
            data: [11, 32, 45, 32, 34, 52, 41],
        },
        {
            name: 'Change Requests',
            data: [5, 12, 8, 15, 10, 20, 18],
        },
    ];

    mainChartOptions: Partial<ChartOptions> = {
        chart: {
            height: 350,
            type: 'area',
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif',
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            type: 'datetime',
            categories: [
                '2023-09-19T00:00:00.000Z',
                '2023-09-19T01:30:00.000Z',
                '2023-09-19T02:30:00.000Z',
                '2023-09-19T03:30:00.000Z',
                '2023-09-19T04:30:00.000Z',
                '2023-09-19T05:30:00.000Z',
                '2023-09-19T06:30:00.000Z',
            ],
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { show: false },
        grid: {
            show: true,
            strokeDashArray: 4,
            padding: { left: 20, right: 0 },
        },
        tooltip: { x: { format: 'dd/MM/yy HH:mm' } },
        colors: ['#3B82F6', '#F59E0B', '#6366F1'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3, // Slightly more transparent at the bottom
                stops: [0, 90, 100],
            },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
        },
    };

    // Donut Chart: Ticket Status
    statusChartSeries: number[] = [44, 55, 13];
    statusChartOptions: Partial<ChartOptions> = {
        chart: {
            type: 'donut',
            height: 300,
            fontFamily: 'Inter, sans-serif',
        },
        labels: ['Open', 'Closed', 'Pending'],
        colors: ['#3B82F6', '#10B981', '#F59E0B'],
        legend: { position: 'bottom' },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: { show: true },
                        value: { show: true },
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false }
    };

    // Recent Activities
    recentActivities = [
        {
            user: 'Alice Smith',
            action: 'created a new ticket',
            target: '#TIK-2024-001',
            time: '2 minutes ago',
            avatar: 'A',
            color: 'bg-blue-500',
        },
        {
            user: 'Bob Johnson',
            action: 'approved access request',
            target: '#REQ-2024-045',
            time: '1 hour ago',
            avatar: 'B',
            color: 'bg-amber-500',
        },
        {
            user: 'Charlie Brown',
            action: 'closed ticket',
            target: '#TIK-2024-089',
            time: '3 hours ago',
            avatar: 'C',
            color: 'bg-green-500',
        },
        {
            user: 'Diana Prince',
            action: 'submitted change request',
            target: '#CR-2024-012',
            time: '5 hours ago',
            avatar: 'D',
            color: 'bg-indigo-500',
        },
    ];

    constructor() {}
}
