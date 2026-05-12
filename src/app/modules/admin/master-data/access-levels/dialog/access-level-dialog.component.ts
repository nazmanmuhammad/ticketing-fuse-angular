import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AccessLevel } from '../access-level.types';
import { RequestTypeService } from '../../request-types/request-type.service';
import { RequestType } from '../../request-types/request-type.types';

@Component({
    selector: 'access-level-dialog',
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
    templateUrl: './access-level-dialog.component.html',
    styles: [
        `
        ::ng-deep .mat-mdc-dialog-surface {
            padding: 0 !important;
        }
        `,
    ],
})
export class AccessLevelDialogComponent implements OnInit {
    accessLevelForm: FormGroup;
    mode: 'create' | 'update' = 'create';
    requestTypes: RequestType[] = [];
    isLoadingRequestTypes = false;

    constructor(
        private _formBuilder: FormBuilder,
        private _requestTypeService: RequestTypeService,
        public matDialogRef: MatDialogRef<AccessLevelDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { accessLevel: AccessLevel }
    ) {
        this.mode = data.accessLevel ? 'update' : 'create';
        
        this.accessLevelForm = this._formBuilder.group({
            request_type_id: [data.accessLevel?.request_type_id || '', Validators.required],
            name: [data.accessLevel?.name || '', Validators.required],
            description: [data.accessLevel?.description || ''],
            status: [data.accessLevel?.status !== undefined ? data.accessLevel.status : 1, Validators.required]
        });
    }

    ngOnInit(): void {
        this._loadRequestTypes();
    }

    save(): void {
        if (this.accessLevelForm.invalid) {
            return;
        }
        this.matDialogRef.close(this.accessLevelForm.value);
    }

    private _loadRequestTypes(): void {
        this.isLoadingRequestTypes = true;
        this._requestTypeService
            .getRequestTypes({ status: '1', per_page: 100 })
            .subscribe((response) => {
                this.requestTypes = response?.data || [];
                this.isLoadingRequestTypes = false;
            });
    }
}
