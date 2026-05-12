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
import { AccessLevel } from '../access-level.types';
import { AccessLevelDialogComponent } from '../dialog/access-level-dialog.component';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { AccessLevelService } from '../access-level.service';
import { RequestTypeService } from '../../request-types/request-type.service';
import { RequestType } from '../../request-types/request-type.types';
import { finalize } from 'rxjs';

@Component({
    selector: 'access-level-list',
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
    templateUrl: './access-level-list.component.html',
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
export class AccessLevelListComponent implements OnInit {
    filterOpen = false;
    searchQuery = '';
    selectedStatus: '' | '1' | '0' = '';
    selectedRequestType = '';
    requestTypes: RequestType[] = [];
    accessLevels: AccessLevel[] = [];
    currentPage = 1;
    lastPage = 1;
    perPage = 10;
    totalItems = 0;
    fromItem = 0;
    toItem = 0;
    isLoading = false;
    isExporting = false;
    skeletonCards = Array.from({ length: 5 });

    constructor(
        private _accessLevelService: AccessLevelService,
        private _requestTypeService: RequestTypeService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackbarService: SnackbarService
    ) {}

    ngOnInit(): void {
        this._loadRequestTypes();
        this._loadAccessLevels();
    }

    get rangeLabel(): string {
        if (this.totalItems === 0) {
            return '0 of 0';
        }
        return `${this.fromItem}-${this.toItem} of ${this.totalItems}`;
    }

    applyFilters(): void {
        this.currentPage = 1;
        this._loadAccessLevels();
    }

    resetFilters(): void {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.selectedRequestType = '';
        this.currentPage = 1;
        this._loadAccessLevels();
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this._loadAccessLevels();
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.lastPage) {
            return;
        }
        this.currentPage = page;
        this._loadAccessLevels();
    }

    openAccessLevelDialog(accessLevel?: AccessLevel): void {
        const dialogRef = this._matDialog.open(AccessLevelDialogComponent, {
            width: '550px',
            disableClose: true,
            data: { accessLevel }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const payload: any = {
                    request_type_id: result.request_type_id,
                    name: result.name,
                    description: result.description || '',
                    status: result.status,
                };

                if (accessLevel) {
                    this._accessLevelService
                        .updateAccessLevel(accessLevel.id, payload)
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadAccessLevels();
                            this._snackbarService.success('Access level berhasil diperbarui');
                        });
                } else {
                    this._accessLevelService
                        .createAccessLevel(payload)
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadAccessLevels();
                            this._snackbarService.success('Access level berhasil ditambahkan');
                        });
                }
            }
        });
    }

    deleteAccessLevel(accessLevel: AccessLevel): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Access Level',
            message: `Are you sure you want to delete <strong>${accessLevel.name}</strong>? This action cannot be undone.`,
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._accessLevelService
                    .deleteAccessLevel(accessLevel.id)
                    .subscribe(() => {
                        this.currentPage = 1;
                        this._loadAccessLevels();
                        this._snackbarService.success('Access level berhasil dihapus');
                    });
            }
        });
    }

    goToPreviousPage(): void {
        if (this.currentPage <= 1) {
            return;
        }
        this.currentPage -= 1;
        this._loadAccessLevels();
    }

    goToNextPage(): void {
        if (this.currentPage >= this.lastPage) {
            return;
        }
        this.currentPage += 1;
        this._loadAccessLevels();
    }

    exportAccessLevels(): void {
        if (this.isExporting) {
            return;
        }
        this.isExporting = true;
        const params = this._buildQueryParams();
        this._accessLevelService
            .exportAccessLevels(params)
            .pipe(
                finalize(() => {
                    this.isExporting = false;
                })
            )
            .subscribe((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `access_levels_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
                anchor.click();
                URL.revokeObjectURL(url);
            });
    }

    getRowNumber(index: number): number {
        const start =
            this.fromItem > 0
                ? this.fromItem
                : (this.currentPage - 1) * this.perPage + 1;
        return start + index;
    }

    private _loadRequestTypes(): void {
        this._requestTypeService
            .getRequestTypes({ status: '1', per_page: 100 })
            .subscribe((response) => {
                this.requestTypes = response?.data || [];
            });
    }

    private _loadAccessLevels(): void {
        this.isLoading = true;
        this.accessLevels = [];
        const params = this._buildQueryParams();
        this._accessLevelService
            .getAccessLevels(params)
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                const rows = Array.isArray(response?.data) ? response.data : [];
                this.accessLevels = rows.map((row: any) => this._mapAccessLevel(row));
                this.currentPage = Number(response?.meta?.current_page ?? this.currentPage);
                this.lastPage = Number(response?.meta?.last_page ?? 1);
                this.perPage = Number(response?.meta?.per_page ?? this.perPage);
                this.totalItems = Number(response?.meta?.total ?? this.accessLevels.length);
                this.fromItem = Number(response?.meta?.from ?? (this.accessLevels.length ? 1 : 0));
                this.toItem = Number(response?.meta?.to ?? this.accessLevels.length);
            });
    }

    private _buildQueryParams(): any {
        const params: any = {
            page: this.currentPage,
            per_page: this.perPage,
        };

        const search = (this.searchQuery || '').trim();
        if (search) {
            params.search = search;
        }

        if (this.selectedStatus) {
            params.status = this.selectedStatus;
        }

        if (this.selectedRequestType) {
            params.request_type_id = this.selectedRequestType;
        }

        return params;
    }

    private _mapAccessLevel(item: any): AccessLevel {
        let formattedDate = '';
        if (item?.created_at) {
            try {
                const date = new Date(item.created_at);
                formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                });
            } catch (e) {
                formattedDate = item.created_at;
            }
        }

        return {
            id: item?.id,
            request_type_id: item?.request_type_id,
            name: item?.name ?? '',
            description: item?.description ?? '',
            status: Number(item?.status ?? 1),
            createdAt: formattedDate,
            requestType: item?.request_type ? {
                id: item.request_type.id,
                name: item.request_type.name
            } : undefined
        };
    }
}
