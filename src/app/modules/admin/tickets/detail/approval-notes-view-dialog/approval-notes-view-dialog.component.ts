import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ApprovalNotesViewDialogData {
    approverName: string;
    status: string;
    notes: string;
    approvedAt: string;
}

@Component({
    selector: 'app-approval-notes-view-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
        <div class="flex flex-col">
            <!-- Header -->
            <div class="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
                <div 
                    class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                    [ngClass]="{
                        'bg-green-100': data.status === 'approved',
                        'bg-red-100': data.status === 'rejected',
                        'bg-yellow-100': data.status === 'pending'
                    }"
                >
                    <mat-icon 
                        class="icon-size-6"
                        [ngClass]="{
                            'text-green-600': data.status === 'approved',
                            'text-red-600': data.status === 'rejected',
                            'text-yellow-600': data.status === 'pending'
                        }"
                    >
                        {{ data.status === 'approved' ? 'check_circle' : (data.status === 'rejected' ? 'cancel' : 'schedule') }}
                    </mat-icon>
                </div>
                <div class="flex-1">
                    <h2 class="text-lg font-bold text-gray-900">Approval Notes</h2>
                    <p class="text-sm text-gray-600">{{ data.approverName }} • {{ data.approvedAt }}</p>
                </div>
            </div>
            
            <!-- Content -->
            <div class="px-6 py-5">
                <div class="mb-4">
                    <span class="mb-2 block text-xs font-medium text-gray-500">Status</span>
                    <span 
                        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold uppercase"
                        [ngClass]="{
                            'bg-green-100 text-green-700': data.status === 'approved',
                            'bg-red-100 text-red-700': data.status === 'rejected',
                            'bg-yellow-100 text-yellow-700': data.status === 'pending'
                        }"
                    >
                        {{ data.status }}
                    </span>
                </div>
                
                <div>
                    <span class="mb-2 block text-xs font-medium text-gray-500">Notes</span>
                    <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ data.notes || 'No notes provided' }}</p>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-end border-t border-gray-200 px-6 py-4">
                <button 
                    type="button"
                    (click)="onClose()"
                    class="rounded-lg bg-gray-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                    Close
                </button>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
        ::ng-deep .mat-mdc-dialog-container {
            padding: 0 !important;
        }
        ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
            min-width: 500px;
            max-width: 600px;
        }
        ::ng-deep .mat-mdc-dialog-title {
            padding: 0 !important;
            margin: 0 !important;
        }
        ::ng-deep .mat-mdc-dialog-content {
            padding: 0 !important;
            margin: 0 !important;
        }
        ::ng-deep .mat-mdc-dialog-actions {
            padding: 0 !important;
            margin: 0 !important;
        }
    `]
})
export class ApprovalNotesViewDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ApprovalNotesViewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ApprovalNotesViewDialogData
    ) {}

    onClose(): void {
        this.dialogRef.close();
    }
}
