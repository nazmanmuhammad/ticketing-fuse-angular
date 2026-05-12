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
import { HelpTopic } from '../help-topic.types';
import { HelpTopicDialogComponent } from '../dialog/help-topic-dialog.component';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { HelpTopicService } from '../help-topic.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'help-topic-list',
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
    templateUrl: './help-topic-list.component.html',
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
export class HelpTopicListComponent implements OnInit {
    filterOpen = false;
    searchQuery = '';
    selectedStatus: '' | 'Active' | 'Inactive' = '';
    helpTopics: HelpTopic[] = [];
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
        private _helpTopicService: HelpTopicService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackbarService: SnackbarService
    ) {}

    ngOnInit(): void {
        this._loadHelpTopics();
    }

    get rangeLabel(): string {
        if (this.totalItems === 0) {
            return '0 of 0';
        }
        return `${this.fromItem}-${this.toItem} of ${this.totalItems}`;
    }

    applyFilters(): void {
        this.currentPage = 1;
        this._loadHelpTopics();
    }

    resetFilters(): void {
        this.searchQuery = '';
        this.selectedStatus = '';
        this.currentPage = 1;
        this._loadHelpTopics();
    }

    onItemsPerPageChange(): void {
        this.currentPage = 1;
        this._loadHelpTopics();
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.lastPage) {
            return;
        }
        this.currentPage = page;
        this._loadHelpTopics();
    }

    openHelpTopicDialog(helpTopic?: HelpTopic): void {
        const dialogRef = this._matDialog.open(HelpTopicDialogComponent, {
            width: '550px',
            disableClose: true,
            data: { helpTopic }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const payload: any = {
                    name: result.name,
                    description: result.description || '',
                    status: result.status === 'Active' ? 1 : 0,
                };

                if (helpTopic) {
                    this._helpTopicService
                        .updateHelpTopic(helpTopic.id, payload)
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadHelpTopics();
                            this._snackbarService.success('Help topic berhasil diperbarui');
                        });
                } else {
                    this._helpTopicService
                        .createHelpTopic(payload)
                        .subscribe(() => {
                            this.currentPage = 1;
                            this._loadHelpTopics();
                            this._snackbarService.success('Help topic berhasil ditambahkan');
                        });
                }
            }
        });
    }

    deleteHelpTopic(helpTopic: HelpTopic): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Help Topic',
            message: `Are you sure you want to delete <strong>${helpTopic.name}</strong>? This action cannot be undone.`,
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._helpTopicService
                    .deleteHelpTopic(helpTopic.id)
                    .subscribe(() => {
                        this.currentPage = 1;
                        this._loadHelpTopics();
                        this._snackbarService.success('Help topic berhasil dihapus');
                    });
            }
        });
    }

    goToPreviousPage(): void {
        if (this.currentPage <= 1) {
            return;
        }
        this.currentPage -= 1;
        this._loadHelpTopics();
    }

    goToNextPage(): void {
        if (this.currentPage >= this.lastPage) {
            return;
        }
        this.currentPage += 1;
        this._loadHelpTopics();
    }

    exportHelpTopics(): void {
        if (this.isExporting) {
            return;
        }
        this.isExporting = true;
        const params = this._buildQueryParams();
        this._helpTopicService
            .exportHelpTopics(params)
            .pipe(
                finalize(() => {
                    this.isExporting = false;
                })
            )
            .subscribe((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `help_topics_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
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

    private _loadHelpTopics(): void {
        this.isLoading = true;
        this.helpTopics = [];
        const params = this._buildQueryParams();
        this._helpTopicService
            .getHelpTopics(params)
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                const rows = Array.isArray(response?.data) ? response.data : [];
                this.helpTopics = rows.map((row: any) => this._mapHelpTopic(row));
                this.currentPage = Number(response?.meta?.current_page ?? this.currentPage);
                this.lastPage = Number(response?.meta?.last_page ?? 1);
                this.perPage = Number(response?.meta?.per_page ?? this.perPage);
                this.totalItems = Number(response?.meta?.total ?? this.helpTopics.length);
                this.fromItem = Number(response?.meta?.from ?? (this.helpTopics.length ? 1 : 0));
                this.toItem = Number(response?.meta?.to ?? this.helpTopics.length);
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
            params.status = this.selectedStatus === 'Active' ? '1' : '0';
        }

        return params;
    }

    private _mapHelpTopic(item: any): HelpTopic {
        // Format created_at to readable date
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
            status: Number(item?.status ?? 1) === 0 ? 'Inactive' : 'Active',
            createdAt: formattedDate,
        };
    }
}
