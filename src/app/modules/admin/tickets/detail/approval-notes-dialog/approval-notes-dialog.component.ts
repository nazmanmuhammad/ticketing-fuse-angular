import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface ApprovalNotesDialogData {
    title: string;
    message: string;
    type: 'approve' | 'decline';
}

@Component({
    selector: 'app-approval-notes-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        FormsModule
    ],
    template: `
        <div class="flex flex-col">
            <!-- Header -->
            <div class="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
                <div 
                    class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                    [ngClass]="{
                        'bg-green-100': data.type === 'approve',
                        'bg-red-100': data.type === 'decline'
                    }"
                >
                    <mat-icon 
                        class="icon-size-6"
                        [ngClass]="{
                            'text-green-600': data.type === 'approve',
                            'text-red-600': data.type === 'decline'
                        }"
                    >
                        {{ data.type === 'approve' ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                </div>
                <div class="flex-1">
                    <h2 class="text-lg font-bold text-gray-900">{{ data.title }}</h2>
                    <p class="text-sm text-gray-600">{{ data.message }}</p>
                </div>
            </div>
            
            <!-- Content -->
            <div class="px-6 py-5">
                <label class="mb-2 block text-sm font-medium text-gray-700">
                    Notes <span class="text-gray-400">(Optional)</span>
                </label>
                <textarea
                    [(ngModel)]="notes"
                    rows="4"
                    placeholder="Add your notes here..."
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
            </div>
            
            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button 
                    type="button"
                    (click)="onCancel()"
                    class="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    (click)="onConfirm()"
                    class="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition"
                    [ngClass]="{
                        'bg-green-600 hover:bg-green-700': data.type === 'approve',
                        'bg-red-600 hover:bg-red-700': data.type === 'decline'
                    }"
                >
                    {{ data.type === 'approve' ? 'Approve' : 'Decline' }}
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
export class ApprovalNotesDialogComponent {
    notes: string = '';

    constructor(
        public dialogRef: MatDialogRef<ApprovalNotesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ApprovalNotesDialogData
    ) {}

    onCancel(): void {
        this.dialogRef.close(null);
    }

    onConfirm(): void {
        this.dialogRef.close(this.notes || undefined);
    }
}
