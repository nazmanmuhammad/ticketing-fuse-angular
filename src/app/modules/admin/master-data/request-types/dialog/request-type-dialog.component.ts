import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { RequestType } from '../request-type.types';

@Component({
    selector: 'request-type-dialog',
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
    templateUrl: './request-type-dialog.component.html',
    styles: [
        `
        ::ng-deep .mat-mdc-dialog-surface {
            padding: 0 !important;
        }
        `,
    ],
})
export class RequestTypeDialogComponent {
    requestTypeForm: FormGroup;
    mode: 'create' | 'update' = 'create';

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<RequestTypeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { requestType: RequestType }
    ) {
        this.mode = data.requestType ? 'update' : 'create';
        
        this.requestTypeForm = this._formBuilder.group({
            name: [data.requestType?.name || '', Validators.required],
            description: [data.requestType?.description || ''],
            status: [data.requestType?.status !== undefined ? data.requestType.status : 1, Validators.required]
        });
    }

    save(): void {
        if (this.requestTypeForm.invalid) {
            return;
        }
        this.matDialogRef.close(this.requestTypeForm.value);
    }
}
