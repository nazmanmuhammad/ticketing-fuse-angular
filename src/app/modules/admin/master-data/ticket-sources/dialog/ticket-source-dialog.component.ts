import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TicketSource } from '../ticket-source.types';

@Component({
    selector: 'ticket-source-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule
    ],
    templateUrl: './ticket-source-dialog.component.html',
    styles: [
        `
        ::ng-deep .mat-mdc-dialog-surface {
            padding: 0 !important;
        }
        `,
    ],
})
export class TicketSourceDialogComponent {
    ticketSourceForm: FormGroup;
    mode: 'create' | 'update' = 'create';

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<TicketSourceDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { ticketSource: TicketSource }
    ) {
        this.mode = data.ticketSource ? 'update' : 'create';
        
        this.ticketSourceForm = this._formBuilder.group({
            name: [data.ticketSource?.name || '', Validators.required],
            description: [data.ticketSource?.description || ''],
            status: [data.ticketSource?.status || 'Active', Validators.required]
        });
    }

    save(): void {
        if (this.ticketSourceForm.invalid) {
            return;
        }
        this.matDialogRef.close(this.ticketSourceForm.value);
    }
}
