import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface ApprovalDialogData {
    action: 'approve' | 'decline';
    approverName: string;
}

@Component({
    selector: 'app-approval-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule
    ],
    template: `
        <h2 mat-dialog-title>
            {{ data.action === 'approve' ? 'Approve' : 'Decline' }} Ticket
        </h2>
        <mat-dialog-content class="py-6">
            <p class="mb-4 text-gray-600">
                Are you sure you want to {{ data.action }} this ticket approval?
            </p>
            <mat-form-field class="w-full">
                <mat-label>Notes (Optional)</mat-label>
                <textarea
                    matInput
                    [(ngModel)]="notes"
                    rows="4"
                    placeholder="Add notes for this {{ data.action }}..."
                ></textarea>
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end" class="gap-2">
            <button mat-button (click)="onCancel()">Cancel</button>
            <button
                mat-flat-button
                [color]="data.action === 'approve' ? 'primary' : 'warn'"
                (click)="onConfirm()"
            >
                {{ data.action === 'approve' ? 'Approve' : 'Decline' }}
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class ApprovalDialogComponent {
    notes: string = '';

    constructor(
        public dialogRef: MatDialogRef<ApprovalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ApprovalDialogData
    ) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        this.dialogRef.close({ confirmed: true, notes: this.notes });
    }
}
