import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
import { SnackbarService } from 'app/core/services/snackbar.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'team-list',
    standalone: true,
    imports: [
        CommonModule, 
        MatDialogModule, 
        MatIconModule, 
        MatButtonModule, 
        MatMenuModule, 
        MatSelectModule,
        MatOptionModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule
    ],
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
export class TeamListComponent implements OnInit {
    filterOpen = false;
    isTableView = false;
    searchQuery = '';
    selectedStatus: '' | 'Active' | 'Inactive' = '';
    users: User[] = [];
    teams: Team[] = [];
    currentPage = 1;
    lastPage = 1;
    perPage = 12;
    totalItems = 0;
    fromItem = 0;
    toItem = 0;
    isLoadingTeams = false;
    isLoadingUsers = false;
    isExporting = false;
    skeletonCards = Array.from({ length: 4 });
    private readonly _backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'http://127.0.0.1:9010/api';
    private readonly _hrisApiUrl: string =
        (globalThis as any)?.__env?.HRIS_API_URL ||
        (globalThis as any)?.process?.env?.HRIS_API_URL ||
        (globalThis as any)?.HRIS_API_URL ||
        'https://back.siglab.co.id';

    constructor(
        private _httpClient: HttpClient,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackbarService: SnackbarService
    ) {}

    ngOnInit(): void {
        this._loadUsers();
        this._loadTeams();
    }

    applyFilters(): void {
        this.currentPage = 1;
        this._loadTeams();
    }

    resetFilters(): void {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.currentPage = 1;
        this._loadTeams();
    }

    openTeamDialog(team?: Team): void {
        if (this.isLoadingUsers) {
            this._snackbarService.info('Data member masih dimuat, coba lagi sebentar');
            return;
        }

        if (this.users.length === 0) {
            this._snackbarService.error('Data member belum tersedia');
            this._loadUsers();
            return;
        }

        const dialogRef = this._matDialog.open(TeamDialogComponent, {
            panelClass: 'team-dialog',
            data: { team, users: this.users }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (team) {
                    this._httpClient
                        .put(
                            this._buildTeamsUrl(String(team.id)),
                            this._buildTeamPayload(result)
                        )
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadTeams();
                            this._snackbarService.success('Team berhasil diperbarui');
                        });
                } else {
                    this._httpClient
                        .post(
                            this._buildTeamsUrl(),
                            this._buildTeamPayload(result)
                        )
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadTeams();
                            this._snackbarService.success('Team berhasil ditambahkan');
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
                this._httpClient
                    .delete(this._buildTeamsUrl(String(team.id)))
                    .subscribe(() => {
                        this.currentPage = 1;
                        this._loadTeams();
                        this._snackbarService.success('Team berhasil dihapus');
                    });
            }
        });
    }

    goToPreviousPage(): void {
        if (this.currentPage <= 1) {
            return;
        }
        this.currentPage -= 1;
        this._loadTeams();
    }

    goToNextPage(): void {
        if (this.currentPage >= this.lastPage) {
            return;
        }
        this.currentPage += 1;
        this._loadTeams();
    }

    exportTeams(): void {
        if (this.isExporting) {
            return;
        }
        this.isExporting = true;
        this._httpClient
            .get(this._buildTeamsExportUrl(), {
                params: this._buildQueryParams(),
                responseType: 'blob',
            })
            .pipe(
                finalize(() => {
                    this.isExporting = false;
                })
            )
            .subscribe((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `teams_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
                anchor.click();
                URL.revokeObjectURL(url);
            });
    }

    toggleViewMode(): void {
        this.isTableView = !this.isTableView;
    }

    getRowNumber(index: number): number {
        const start =
            this.fromItem > 0
                ? this.fromItem
                : (this.currentPage - 1) * this.perPage + 1;
        return start + index;
    }

    getMemberNames(team: Team): string {
        const names = (team.members || [])
            .map((member) => member?.fullName)
            .filter((name) => !!name);
        return names.length ? names.join(', ') : '-';
    }

    private _loadTeams(): void {
        this.isLoadingTeams = true;
        this.teams = [];
        this._httpClient
            .get<any>(this._buildTeamsUrl(), { params: this._buildQueryParams() })
            .pipe(
                finalize(() => {
                    this.isLoadingTeams = false;
                })
            )
            .subscribe((response) => {
                const rows = Array.isArray(response?.data) ? response.data : [];
                this.teams = rows.map((row: any) => this._mapTeam(row));
                this.currentPage = Number(response?.meta?.current_page ?? this.currentPage);
                this.lastPage = Number(response?.meta?.last_page ?? 1);
                this.perPage = Number(response?.meta?.per_page ?? this.perPage);
                this.totalItems = Number(response?.meta?.total ?? this.teams.length);
                this.fromItem = Number(response?.meta?.from ?? (this.teams.length ? 1 : 0));
                this.toItem = Number(response?.meta?.to ?? this.teams.length);
            });
    }

    private _loadUsers(): void {
        this.isLoadingUsers = true;
        this._httpClient
            .get<any>(`${this._backendApiUrl.replace(/\/$/, '')}/users`, {
                params: new HttpParams().set('per_page', 300),
            })
            .pipe(
                finalize(() => {
                    this.isLoadingUsers = false;
                })
            )
            .subscribe((response) => {
                const rows = Array.isArray(response?.data) ? response.data : [];
                const photoBase = this._hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
                this.users = rows.map((row: any) => {
                    const photo = row?.photo || '';
                    const roleNumber = Number(row?.role ?? 0);
                    const role =
                        roleNumber === 2 ? 'Admin' : roleNumber === 1 ? 'Agent' : 'User';
                    return {
                        id: row?.id,
                        fullName: row?.name ?? '',
                        email: row?.email ?? '',
                        role,
                        status: Number(row?.status ?? 1) === 0 ? 'Inactive' : 'Active',
                        department: row?.department?.name ?? '',
                        avatar: photo
                            ? `${photoBase}/assets/img/user/${photo}`
                            : 'assets/images/avatars/male-01.jpg',
                        photo,
                    } as User;
                });
            });
    }

    private _buildTeamsUrl(id?: string): string {
        const base = this._backendApiUrl.replace(/\/$/, '');
        return id ? `${base}/teams/${id}` : `${base}/teams`;
    }

    private _buildTeamsExportUrl(): string {
        return `${this._backendApiUrl.replace(/\/$/, '')}/teams/export`;
    }

    private _buildQueryParams(): HttpParams {
        let params = new HttpParams()
            .set('page', this.currentPage)
            .set('per_page', this.perPage);

        const search = (this.searchQuery || '').trim();
        if (search) {
            params = params.set('search', search);
        }

        if (this.selectedStatus) {
            params = params.set('status', this.selectedStatus === 'Active' ? '1' : '0');
        }

        return params;
    }

    private _buildTeamPayload(result: any): any {
        const members: User[] = Array.isArray(result?.members) ? result.members : [];
        return {
            name: result?.name || '',
            description: result?.description || '',
            members: members.map((member) => member.id),
        };
    }

    private _mapTeam(item: any): Team {
        const members = Array.isArray(item?.team_users)
            ? item.team_users
                  .map((entry: any) => {
                      const user = entry?.user;
                      if (!user) {
                          return null;
                      }
                      const existing =
                          this.users.find((u) => String(u.id) === String(user?.id)) || null;
                      if (existing) {
                          return existing;
                      }
                      return {
                          id: user?.id,
                          fullName: user?.name ?? '-',
                          email: user?.email ?? '-',
                          role: 'User',
                          status: Number(user?.status ?? 1) === 0 ? 'Inactive' : 'Active',
                          avatar: 'assets/images/avatars/male-01.jpg',
                      } as User;
                  })
                  .filter((member: User | null) => Boolean(member))
            : [];

        return {
            id: item?.id,
            name: item?.name ?? '',
            description: item?.description ?? '',
            members,
            status: Number(item?.status ?? 1) === 0 ? 'Inactive' : 'Active',
            createdAt: item?.created_at ?? '',
        };
    }

    getOverflowMembersTooltip(team: Team): string {
        const names = (team.members || [])
            .slice(3)
            .map((member) => member?.fullName)
            .filter((name) => !!name);
        return names.join(', ');
    }
}
