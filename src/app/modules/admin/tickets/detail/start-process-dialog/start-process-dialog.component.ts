import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'start-process-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        TranslocoModule,
    ],
    templateUrl: './start-process-dialog.component.html',
    styles: [
        `
        ::ng-deep .mat-mdc-dialog-surface {
            padding: 0 !important;
        }
        `,
    ],

})
export class StartProcessDialogComponent {
    form: FormGroup;
    minDate: string;

    constructor(
        private _formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<StartProcessDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        // Set minimum date to today
        const today = new Date();
        this.minDate = today.toISOString().split('T')[0];

        this.form = this._formBuilder.group({
            start_date: [this.minDate, Validators.required],
            end_date: [''], // Optional
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.value;
        
        // Validate that end_date is after start_date if provided
        if (formValue.end_date && formValue.start_date) {
            const startDate = new Date(formValue.start_date);
            const endDate = new Date(formValue.end_date);
            
            if (endDate < startDate) {
                // Show error - end date must be after start date
                return;
            }
        }

        this.dialogRef.close(formValue);
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
