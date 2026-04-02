import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';

export interface ConfirmationDialogData {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

@Injectable({
    providedIn: 'root',
})
export class ConfirmationDialogService {
    constructor(private _dialog: MatDialog) {}

    /**
     * Open confirmation dialog
     */
    confirm(data: ConfirmationDialogData): Observable<boolean> {
        const dialogRef: MatDialogRef<ConfirmationDialogComponent> =
            this._dialog.open(ConfirmationDialogComponent, {
                width: '400px',
                disableClose: false,
                data: {
                    title: data.title || 'Confirm Action',
                    message: data.message,
                    confirmText: data.confirmText || 'Confirm',
                    cancelText: data.cancelText || 'Cancel',
                    type: data.type || 'info',
                },
            });

        return dialogRef.afterClosed();
    }

    /**
     * Open delete confirmation dialog
     */
    confirmDelete(
        itemName: string = 'this item',
        customMessage?: string
    ): Observable<boolean> {
        return this.confirm({
            title: 'Delete Confirmation',
            message:
                customMessage ||
                `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger',
        });
    }

    /**
     * Open warning confirmation dialog
     */
    confirmWarning(message: string, title?: string): Observable<boolean> {
        return this.confirm({
            title: title || 'Warning',
            message,
            confirmText: 'Continue',
            cancelText: 'Cancel',
            type: 'warning',
        });
    }
}
