import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
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
import { SnackbarService } from 'app/core/services/snackbar.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'user-list',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatMenuModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
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
export class UserListComponent implements OnInit {
    filterOpen = false;
    isTableView = false;
    searchQuery = '';
    selectedStatus = '';
    users: User[] = [];
    currentPage = 1;
    lastPage = 1;
    perPage = 12;
    totalItems = 0;
    fromItem = 0;
    toItem = 0;
    isExporting = false;
    isLoadingUsers = false;
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
    }

    openUserDialog(user?: User): void {
        const dialogRef = this._matDialog.open(UserDialogComponent, {
            panelClass: 'user-dialog',
            autoFocus: false,
            data: { user, users: this.users },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                if (user) {
                    this._httpClient
                        .put(
                            this._buildUsersUrl(String(user.id)),
                            this._buildPayloadFromDialogResult(result)
                        )
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadUsers();
                            this._snackbarService.success('User berhasil diperbarui');
                        });
                } else {
                    this._httpClient
                        .post(
                            this._buildUsersUrl(),
                            this._buildPayloadFromDialogResult(result)
                        )
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadUsers();
                            this._snackbarService.success('User berhasil ditambahkan');
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
                this._httpClient
                    .delete(this._buildUsersUrl(String(user.id)))
                    .subscribe(() => {
                        this.currentPage = 1;
                        this._loadUsers();
                        this._snackbarService.success('User berhasil dihapus');
                    });
            }
        });
    }

    applyFilters(): void {
        this.currentPage = 1;
        this._loadUsers();
    }

    resetFilters(): void {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.currentPage = 1;
        this._loadUsers();
    }

    goToPreviousPage(): void {
        if (this.currentPage <= 1) {
            return;
        }
        this.currentPage -= 1;
        this._loadUsers();
    }

    goToNextPage(): void {
        if (this.currentPage >= this.lastPage) {
            return;
        }
        this.currentPage += 1;
        this._loadUsers();
    }

    exportUsers(): void {
        if (this.isExporting) {
            return;
        }
        this.isExporting = true;
        const params = this._buildQueryParams();
        this._httpClient
            .get(this._buildUsersExportUrl(), {
                params,
                responseType: 'blob',
            })
            .subscribe({
                next: (blob: Blob) => {
                    const objectUrl = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = objectUrl;
                    anchor.download = `users_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
                    anchor.click();
                    URL.revokeObjectURL(objectUrl);
                },
                complete: () => {
                    this.isExporting = false;
                },
                error: () => {
                    this.isExporting = false;
                },
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

    getRoleClass(role: string): string {
        switch (role) {
            case 'Admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400';
            case 'Manager': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/30 dark:text-indigo-400';
            case 'Agent': return 'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    private _loadUsers(): void {
        const params = this._buildQueryParams();
        this.isLoadingUsers = true;
        this._httpClient
            .get<any>(this._buildUsersUrl(), { params })
            .pipe(
                finalize(() => {
                    this.isLoadingUsers = false;
                })
            )
            .subscribe((response) => {
                const rows = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                      ? response
                      : [];
                this.users = rows.map((row: any) => this._mapApiUser(row));
                this.currentPage = Number(response?.meta?.current_page ?? this.currentPage);
                this.lastPage = Number(response?.meta?.last_page ?? 1);
                this.perPage = Number(response?.meta?.per_page ?? this.perPage);
                this.totalItems = Number(response?.meta?.total ?? this.users.length);
                this.fromItem = Number(response?.meta?.from ?? (this.users.length ? 1 : 0));
                this.toItem = Number(response?.meta?.to ?? this.users.length);
            });
    }

    private _buildUsersUrl(id?: string): string {
        const base = this._backendApiUrl.replace(/\/$/, '');
        return id ? `${base}/users/${id}` : `${base}/users`;
    }

    private _buildUsersExportUrl(): string {
        const base = this._backendApiUrl.replace(/\/$/, '');
        return `${base}/users/export`;
    }

    private _buildQueryParams(): HttpParams {
        let params = new HttpParams()
            .set('page', this.currentPage)
            .set('per_page', this.perPage);

        const search = (this.searchQuery || '').trim();
        if (search) {
            params = params.set('search', search);
        }

        if (this.selectedStatus !== '') {
            const statusValue = this.selectedStatus === 'Active' ? '1' : '0';
            params = params.set('status', statusValue);
        }

        return params;
    }

    private _buildPayloadFromDialogResult(result: any): any {
        return {
            hris_user_id:
                Number(result?.hrisUserId ?? result?.userId ?? 0) || null,
            name: result?.fullName || '',
            email: result?.email || '',
            photo:
                result?.photo || this._extractPhotoFromUrl(result?.avatar || ''),
            role: this._mapRoleToNumber(result?.role),
            department_id: result?.departmentId || null,
            status: result?.status === 'Inactive' ? 0 : 1,
        };
    }

    private _mapApiUser(row: any): User {
        const hasRoleNumber = row?.role !== undefined && row?.role !== null;
        const roleNumber = Number(row?.role ?? 0);
        const roleNameFromNumber =
            roleNumber === 2 ? 'Admin' : roleNumber === 1 ? 'Agent' : 'User';
        const roleName = hasRoleNumber ? roleNameFromNumber : row?.role_name ?? 'User';
        const normalizedRole =
            roleName === 'Admin'
                ? 'Admin'
                : roleName === 'Agent'
                  ? 'Agent'
                  : roleName === 'Manager'
                    ? 'Manager'
                    : roleName === 'Staff'
                      ? 'Staff'
                      : 'User';

        const photo = row?.photo || '';
        const photoBase = this._hrisApiUrl
            .replace(/\/$/, '')
            .replace(/\/api$/, '');

        return {
            id: row?.id,
            fullName: row?.name ?? '',
            email: row?.email ?? '',
            employeeId: Number(row?.hris_user_id ?? 0) || undefined,
            hrisUserId: Number(row?.hris_user_id ?? 0) || undefined,
            userId: Number(row?.hris_user_id ?? 0) || undefined,
            role: normalizedRole,
            department:
                row?.department?.name ??
                row?.department_name ??
                row?.department_id ??
                '',
            departmentId: row?.department_id ?? '',
            lastLogin: row?.last_login_at
                ? new Date(row.last_login_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                  })
                : 'Never',
            status: Number(row?.status ?? 1) === 0 ? 'Inactive' : 'Active',
            photo,
            avatar: photo
                ? `${photoBase}/assets/img/user/${photo}`
                : 'assets/images/avatars/male-01.jpg',
        };
    }

    private _mapRoleToNumber(role: string): number {
        if (role === 'Admin') {
            return 2;
        }
        if (role === 'Agent') {
            return 1;
        }
        return 0;
    }

    private _extractPhotoFromUrl(url: string): string {
        if (!url) {
            return '';
        }
        const fileName = url.split('/').pop() || '';
        return fileName.includes('.') ? fileName : '';
    }
}
