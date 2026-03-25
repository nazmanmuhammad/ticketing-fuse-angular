import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
    constructor(private _matSnackBar: MatSnackBar) {}

    success(message: string): void {
        this._matSnackBar.open(message, 'OK', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['app-snackbar-success'],
        });
    }

    error(message: string): void {
        this._matSnackBar.open(message, 'OK', {
            duration: 3500,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['app-snackbar-error'],
        });
    }

    info(message: string): void {
        this._matSnackBar.open(message, 'OK', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['app-snackbar-info'],
        });
    }
}
