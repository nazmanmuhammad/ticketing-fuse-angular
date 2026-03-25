import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
import { SnackbarService } from 'app/core/services/snackbar.service';
import { finalize } from 'rxjs';

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
        MatInputModule,
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
export class DepartmentListComponent implements OnInit {
    departments: Department[] = [];
    users: User[] = [];
    filterOpen = false;
    itemsPerPage = 10;
    currentPage = 1;
    lastPage = 1;
    totalItems = 0;
    fromItem = 0;
    toItem = 0;
    isLoadingDepartments = false;
    isExporting = false;
    skeletonRows = Array.from({ length: 6 });
    filter = {
        name: '',
        status: ''
    };
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
        this._loadDepartmentUsers();
        this._loadDepartments();
    }

    resetFilter(): void {
        this.filter = {
            name: '',
            status: ''
        };
        this.currentPage = 1;
        this._loadDepartments();
    }

    applyFilters(): void {
        this.currentPage = 1;
        this._loadDepartments();
    }

    openDepartmentDialog(department?: Department): void {
        const dialogRef = this._matDialog.open(DepartmentDialogComponent, {
            panelClass: 'department-dialog',
            data: { department, users: this.users }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (department) {
                    this._httpClient
                        .put(
                            this._buildDepartmentsUrl(String(department.id)),
                            this._buildDepartmentPayload(result)
                        )
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadDepartments();
                            this._snackbarService.success('Department berhasil diperbarui');
                        });
                } else {
                    this._httpClient
                        .post(
                            this._buildDepartmentsUrl(),
                            this._buildDepartmentPayload(result)
                        )
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadDepartments();
                            this._snackbarService.success('Department berhasil ditambahkan');
                        });
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
                this._httpClient
                    .delete(this._buildDepartmentsUrl(String(department.id)))
                    .subscribe(() => {
                        this.currentPage = 1;
                        this._loadDepartments();
                        this._snackbarService.success('Department berhasil dihapus');
                    });
            }
        });
    }

    exportDepartments(): void {
        if (this.isExporting) {
            return;
        }
        this.isExporting = true;
        this._httpClient
            .get(this._buildDepartmentsExportUrl(), {
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
                anchor.download = `departments_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
                anchor.click();
                URL.revokeObjectURL(url);
            });
    }

    get paginatedDepartments(): Department[] {
        return this.departments;
    }

    get totalPages(): number {
        return Math.max(1, this.lastPage);
    }

    get rangeLabel(): string {
        if (this.totalItems === 0 || this.isLoadingDepartments) {
            return '0 - 0 of 0';
        }
        return `${this.fromItem} - ${this.toItem} of ${this.totalItems}`;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this._loadDepartments();
        }
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this._loadDepartments();
    }

    private _loadDepartments(): void {
        this.isLoadingDepartments = true;
        this.departments = [];
        this._httpClient
            .get<any>(this._buildDepartmentsUrl(), { params: this._buildQueryParams() })
            .pipe(
                finalize(() => {
                    this.isLoadingDepartments = false;
                })
            )
            .subscribe((response) => {
                const rows = Array.isArray(response?.data) ? response.data : [];
                this.departments = rows.map((item: any) => this._mapDepartment(item));
                this.currentPage = Number(response?.meta?.current_page ?? this.currentPage);
                this.lastPage = Number(response?.meta?.last_page ?? 1);
                this.totalItems = Number(response?.meta?.total ?? this.departments.length);
                this.fromItem = Number(response?.meta?.from ?? (this.departments.length ? 1 : 0));
                this.toItem = Number(response?.meta?.to ?? this.departments.length);
            });
    }

    private _loadDepartmentUsers(): void {
        this._httpClient
            .get<any>(`${this._backendApiUrl.replace(/\/$/, '')}/users`, {
                params: new HttpParams().set('per_page', 200),
            })
            .subscribe((response) => {
                const rows = Array.isArray(response?.data) ? response.data : [];
                const photoBase = this._hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
                this.users = rows.map((row: any) => {
                    const photo = row?.photo || '';
                    const roleValue = Number(row?.role ?? 0);
                    const role =
                        roleValue === 2
                            ? 'Admin'
                            : roleValue === 1
                              ? 'Agent'
                              : 'User';

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

    private _buildDepartmentsUrl(id?: string): string {
        const base = this._backendApiUrl.replace(/\/$/, '');
        return id ? `${base}/departments/${id}` : `${base}/departments`;
    }

    private _buildDepartmentsExportUrl(): string {
        return `${this._backendApiUrl.replace(/\/$/, '')}/departments/export`;
    }

    private _buildQueryParams(): HttpParams {
        let params = new HttpParams()
            .set('page', this.currentPage)
            .set('per_page', this.itemsPerPage);

        const search = (this.filter.name || '').trim();
        if (search) {
            params = params.set('search', search);
        }

        if (this.filter.status) {
            params = params.set('status', this.filter.status === 'Active' ? '1' : '0');
        }

        return params;
    }

    private _buildDepartmentPayload(result: any): any {
        const headId = result?.head?.id ?? result?.head_id ?? null;
        return {
            name: result?.name || '',
            description: result?.description || '',
            status: result?.status === 'Inactive' ? 0 : 1,
            head_id: headId,
        };
    }

    private _mapDepartment(item: any): Department {
        const headId = item?.head_id ?? item?.head?.id ?? item?.headId ?? null;
        const headUser =
            this.users.find((user) => String(user.id) === String(headId)) ||
            (item?.head
                ? ({
                      id: item?.head?.id,
                      fullName: item?.head?.name ?? '-',
                      email: item?.head?.email ?? '-',
                      role: 'User',
                      status: Number(item?.head?.status ?? 1) === 0 ? 'Inactive' : 'Active',
                      avatar: item?.head?.photo
                          ? `${this._hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '')}/assets/img/user/${item.head.photo}`
                          : 'assets/images/avatars/male-01.jpg',
                      photo: item?.head?.photo ?? '',
                  } as User)
                : null);

        return {
            id: item?.id,
            name: item?.name ?? '',
            description: item?.description ?? '',
            head: headUser,
            status: Number(item?.status ?? 1) === 0 ? 'Inactive' : 'Active',
            createdAt: item?.created_at
                ? new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                  })
                : '-',
        };
    }

    getRowNumber(index: number): number {
        const base = this.fromItem > 0 ? this.fromItem : 1;
        return base + index;
    }
}
