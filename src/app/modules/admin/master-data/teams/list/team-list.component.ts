import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Team } from '../team.types';
import { TeamDialogComponent } from '../dialog/team-dialog.component';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { User } from '../../users/user.types';

@Component({
    selector: 'team-list',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatMenuModule, FormsModule],
    templateUrl: './team-list.component.html',
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
export class TeamListComponent {
    filterOpen = false;
    searchQuery = '';
    
    // Mock Users for team members
    mockUsers: User[] = [
        { id: 1, fullName: 'John Doe', email: 'john.doe@example.com', role: 'Admin', department: 'IT', lastLogin: '05 Mar 2026', status: 'Active', avatar: 'assets/images/avatars/male-01.jpg' },
        { id: 2, fullName: 'Sarah Connor', email: 'sarah.connor@example.com', role: 'Agent', department: 'Support', lastLogin: '10 Nov 2025', status: 'Inactive', avatar: 'assets/images/avatars/female-02.jpg' },
        { id: 3, fullName: 'Michael Scott', email: 'michael.scott@example.com', role: 'Manager', department: 'Sales', lastLogin: '01 Dec 2025', status: 'Active', avatar: 'assets/images/avatars/male-03.jpg' },
        { id: 4, fullName: 'Pam Beesly', email: 'pam.beesly@example.com', role: 'Agent', department: 'Support', lastLogin: '18 Dec 2025', status: 'Active', avatar: 'assets/images/avatars/female-04.jpg' },
        { id: 5, fullName: 'Jim Halpert', email: 'jim.halpert@example.com', role: 'Manager', department: 'Sales', lastLogin: '17 Dec 2025', status: 'Active', avatar: 'assets/images/avatars/male-05.jpg' },
    ];

    teams: Team[] = [
        {
            id: 1,
            name: 'Support Team',
            description: 'Handle support tickets',
            members: [this.mockUsers[0], this.mockUsers[1]]
        },
        {
            id: 2,
            name: 'Sales Team',
            description: 'Responsible for sales pipeline',
            members: [this.mockUsers[2], this.mockUsers[3], this.mockUsers[4]]
        }
    ];

    constructor(
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService
    ) {}

    openTeamDialog(team?: Team): void {
        const dialogRef = this._matDialog.open(TeamDialogComponent, {
            panelClass: 'team-dialog',
            data: { team, users: this.mockUsers }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (team) {
                    // Update
                    const index = this.teams.findIndex(t => t.id === team.id);
                    if (index > -1) {
                        this.teams[index] = { ...team, ...result };
                    }
                } else {
                    // Create
                    this.teams.push({
                        id: this.teams.length + 1,
                        ...result
                    });
                }
            }
        });
    }

    deleteTeam(team: Team): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Team',
            message: `Are you sure you want to delete <strong>${team.name}</strong>? This action cannot be undone.`,
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.teams = this.teams.filter(t => t.id !== team.id);
            }
        });
    }
}
