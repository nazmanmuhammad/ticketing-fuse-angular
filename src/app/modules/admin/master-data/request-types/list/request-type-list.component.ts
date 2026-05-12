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
import { RequestType } from '../request-type.types';
import { RequestTypeDialogComponent } from '../dialog/request-type-dialog.component';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { RequestTypeService } from '../request-type.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'request-type-list',
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
    templateUrl: './request-type-list.component.html',
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
export class RequestTypeListComponent implements OnInit {
    filterOpen = false;
    searchQuery = '';
    selectedStatus: '' | '1' | '0' = '';
    requestTypes: RequestType[] = [];
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
        private _requestTypeService: RequestTypeService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackbarService: SnackbarService
    ) {}

    ngOnInit(): void {
        this._loadRequestTypes();
    }

    get rangeLabel(): string {
        if (this.totalItems === 0) {
            return '0 of 0';
        }
        return `${this.fromItem}-${this.toItem} of ${this.totalItems}`;
    }

    applyFilters(): void {
        this.currentPage = 1;
        this._loadRequestTypes();
    }

    resetFilters(): void {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.currentPage = 1;
        this._loadRequestTypes();
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this._loadRequestTypes();
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.lastPage) {
            return;
        }
        this.currentPage = page;
        this._loadRequestTypes();
    }

    openRequestTypeDialog(requestType?: RequestType): void {
        const dialogRef = this._matDialog.open(RequestTypeDialogComponent, {
            width: '550px',
            disableClose: true,
            data: { requestType }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const payload: any = {
                    name: result.name,
                    description: result.description || '',
                    status: result.status,
                };

                if (requestType) {
                    this._requestTypeService
                        .updateRequestType(requestType.id, payload)
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadRequestTypes();
                            this._snackbarService.success('Request type berhasil diperbarui');
                        });
                } else {
                    this._requestTypeService
                        .createRequestType(payload)
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadRequestTypes();
                            this._snackbarService.success('Request type berhasil ditambahkan');
                        });
                }
            }
        });
    }

    deleteRequestType(requestType: RequestType): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Request Type',
            message: `Are you sure you want to delete <strong>${requestType.name}</strong>? This action cannot be undone.`,
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._requestTypeService
                    .deleteRequestType(requestType.id)
                    .subscribe(() => {
                        this.currentPage = 1;
                        this._loadRequestTypes();
                        this._snackbarService.success('Request type berhasil dihapus');
                    });
            }
        });
    }

    goToPreviousPage(): void {
        if (this.currentPage <= 1) {
            return;
        }
        this.currentPage -= 1;
        this._loadRequestTypes();
    }

    goToNextPage(): void {
        if (this.currentPage >= this.lastPage) {
            return;
        }
        this.currentPage += 1;
        this._loadRequestTypes();
    }

    exportRequestTypes(): void {
        if (this.isExporting) {
            return;
        }
        this.isExporting = true;
        const params = this._buildQueryParams();
        this._requestTypeService
            .exportRequestTypes(params)
            .pipe(
                finalize(() => {
                    this.isExporting = false;
                })
            )
            .subscribe((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `request_types_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
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
        this.isLoading = true;
        this.requestTypes = [];
        const params = this._buildQueryParams();
        this._requestTypeService
            .getRequestTypes(params)
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                const rows = Array.isArray(response?.data) ? response.data : [];
                this.requestTypes = rows.map((row: any) => this._mapRequestType(row));
                this.currentPage = Number(response?.meta?.current_page ?? this.currentPage);
                this.lastPage = Number(response?.meta?.last_page ?? 1);
                this.perPage = Number(response?.meta?.per_page ?? this.perPage);
                this.totalItems = Number(response?.meta?.total ?? this.requestTypes.length);
                this.fromItem = Number(response?.meta?.from ?? (this.requestTypes.length ? 1 : 0));
                this.toItem = Number(response?.meta?.to ?? this.requestTypes.length);
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

        return params;
    }

    private _mapRequestType(item: any): RequestType {
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
            name: item?.name ?? '',
            description: item?.description ?? '',
            status: Number(item?.status ?? 1),
            createdAt: formattedDate,
        };
    }
}
