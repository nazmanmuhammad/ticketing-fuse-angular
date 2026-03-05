import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Department } from '../department.types';
import { DepartmentDialogComponent } from '../dialog/department-dialog.component';
import { User } from '../../users/user.types';
import { FormsModule } from '@angular/forms';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';

@Component({
    selector: 'department-list',
    standalone: true,
    imports: [
        CommonModule, 
        MatIconModule, 
        MatButtonModule, 
        MatMenuModule,
        MatDialogModule,
        MatSelectModule,
        MatOptionModule,
        MatFormFieldModule,
        FormsModule
    ],
    templateUrl: './department-list.component.html',
    animations: [
        trigger('collapseFilter', [
            state(
                'open',
                style({
                    height: '*',
                    opacity: 1,
                    overflow: 'hidden',
                    marginTop: '16px',
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
export class DepartmentListComponent {
    departments: Department[] = [];
    filterOpen = false;
    filter = {
        name: '',
        status: ''
    };

    // Mock Users for Head selection
    mockUsers: User[] = [
        {
            id: 1,
            fullName: 'John Doe',
            email: 'john.doe@company.com',
            role: 'Admin',
            status: 'Active',
            department: 'IT',
            avatar: 'assets/images/avatars/male-01.jpg'
        },
        {
            id: 2,
            fullName: 'Jane Smith',
            email: 'jane.smith@company.com',
            role: 'Manager',
            status: 'Active',
            department: 'HR',
            avatar: 'assets/images/avatars/female-02.jpg'
        },
        {
            id: 3,
            fullName: 'Robert Johnson',
            email: 'robert.j@company.com',
            role: 'User',
            status: 'Inactive',
            department: 'Sales',
            avatar: 'assets/images/avatars/male-03.jpg'
        }
    ];

    constructor(
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService
    ) {
        // Initialize with mock data matching the image
        this.departments = [
            {
                id: 1,
                name: 'Customer Support',
                description: 'Handle customer inquiries and support tickets',
                head: this.mockUsers[0],
                status: 'Active',
                createdAt: '05 Jan 2025'
            },
            {
                id: 2,
                name: 'Sales',
                description: 'Manage sales pipeline and opportunities',
                head: { ...this.mockUsers[1], fullName: 'Sarah Connor', avatar: 'assets/images/avatars/female-05.jpg' },
                status: 'Active',
                createdAt: '12 Jan 2025'
            },
            {
                id: 3,
                name: 'Finance',
                description: 'Oversee company financial operations and reporting',
                head: { ...this.mockUsers[2], fullName: 'Michael Scott', avatar: 'assets/images/avatars/male-06.jpg' },
                status: 'Inactive',
                createdAt: '20 Dec 2024'
            }
        ];
    }

    resetFilter(): void {
        this.filter = {
            name: '',
            status: ''
        };
    }

    openDepartmentDialog(department?: Department): void {
        const dialogRef = this._matDialog.open(DepartmentDialogComponent, {
            panelClass: 'department-dialog',
            data: { department, users: this.mockUsers }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (department) {
                    // Update existing department
                    const index = this.departments.findIndex(d => d.id === department.id);
                    if (index > -1) {
                        this.departments[index] = { ...department, ...result };
                    }
                } else {
                    // Add new department
                    const newDepartment: Department = {
                        id: this.departments.length + 1,
                        ...result,
                        createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    };
                    this.departments.push(newDepartment);
                }
            }
        });
    }

    deleteDepartment(department: Department): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Department',
            message: 'Are you sure you want to delete this department? This action cannot be undone.',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.departments = this.departments.filter(d => d.id !== department.id);
            }
        });
    }
}
