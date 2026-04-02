import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root',
})
export class SnackbarService {
    constructor(private _snackBar: MatSnackBar) {}

    /**
     * Show success message
     */
    success(message: string, duration: number = 3000): void {
        this._snackBar.open(message, 'Close', {
            duration,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-success'],
        });
    }

    /**
     * Show error message
     */
    error(message: string, duration: number = 5000): void {
        this._snackBar.open(message, 'Close', {
            duration,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-error'],
        });
    }

    /**
     * Show warning message
     */
    warning(message: string, duration: number = 4000): void {
        this._snackBar.open(message, 'Close', {
            duration,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-warning'],
        });
    }

    /**
     * Show info message
     */
    info(message: string, duration: number = 3000): void {
        this._snackBar.open(message, 'Close', {
            duration,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-info'],
        });
    }

    /**
     * Dismiss all snackbars
     */
    dismiss(): void {
        this._snackBar.dismiss();
    }
}
