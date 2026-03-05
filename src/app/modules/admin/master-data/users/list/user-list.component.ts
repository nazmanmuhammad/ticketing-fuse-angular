import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { User } from '../user.types';
import { UserDialogComponent } from '../dialog/user-dialog.component';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'user-list',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatMenuModule, FormsModule, MatFormFieldModule, MatSelectModule],
    templateUrl: './user-list.component.html',
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
export class UserListComponent {
    filterOpen = false;
    searchQuery = '';
    selectedStatus = '';
    users: User[] = [
        {
            id: 1,
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            role: 'Admin',
            department: 'IT',
            lastLogin: '05 Mar 2026',
            status: 'Active',
            avatar: 'assets/images/avatars/male-01.jpg'
        },
        {
            id: 2,
            fullName: 'Sarah Connor',
            email: 'sarah.connor@example.com',
            role: 'Agent',
            department: 'Support',
            lastLogin: '10 Nov 2025',
            status: 'Inactive',
            avatar: 'assets/images/avatars/female-02.jpg'
        },
        {
            id: 3,
            fullName: 'Michael Scott',
            email: 'michael.scott@example.com',
            role: 'Manager',
            department: 'Sales',
            lastLogin: '01 Dec 2025',
            status: 'Active',
            avatar: 'assets/images/avatars/male-03.jpg'
        },
        {
            id: 4,
            fullName: 'Pam Beesly',
            email: 'pam.beesly@example.com',
            role: 'Agent',
            department: 'Support',
            lastLogin: '18 Dec 2025',
            status: 'Active',
            avatar: 'assets/images/avatars/female-04.jpg'
        },
        {
            id: 5,
            fullName: 'Jim Halpert',
            email: 'jim.halpert@example.com',
            role: 'Manager',
            department: 'Sales',
            lastLogin: '17 Dec 2025',
            status: 'Active',
            avatar: 'assets/images/avatars/male-05.jpg'
        },
        {
            id: 6,
            fullName: 'Dwight Schrute',
            email: 'dwight.schrute@example.com',
            role: 'Admin',
            department: 'Operations',
            lastLogin: '05 Oct 2025',
            status: 'Inactive',
            avatar: 'assets/images/avatars/male-06.jpg'
        }
    ];

    constructor(
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService
    ) {}

    openUserDialog(user?: User): void {
        const dialogRef = this._matDialog.open(UserDialogComponent, {
            panelClass: 'user-dialog',
            data: { user }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (user) {
                    // Update
                    const index = this.users.findIndex(u => u.id === user.id);
                    if (index > -1) {
                        this.users[index] = { ...user, ...result };
                    }
                } else {
                    // Create
                    this.users.push({
                        id: this.users.length + 1,
                        ...result,
                        lastLogin: 'Never',
                        avatar: 'assets/images/avatars/brian-hughes.jpg'
                    });
                }
            }
        });
    }

    deleteUser(user: User): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete User',
            message: `Are you sure you want to delete <strong>${user.fullName}</strong>? This action cannot be undone.`,
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.users = this.users.filter(u => u.id !== user.id);
            }
        });
    }

    getRoleClass(role: string): string {
        switch (role) {
            case 'Admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400';
            case 'Manager': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/30 dark:text-indigo-400';
            case 'Agent': return 'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
