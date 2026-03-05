import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../user.types';

@Component({
    selector: 'user-dialog',
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
    templateUrl: './user-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class UserDialogComponent {
    userForm: FormGroup;
    mode: 'create' | 'update' = 'create';

    roles = ['Admin', 'Manager', 'Agent'];
    departments = ['IT', 'Support', 'Sales', 'Operations', 'Finance', 'HR'];
    statuses = ['Active', 'Inactive'];

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<UserDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { user: User }
    ) {
        this.mode = data.user ? 'update' : 'create';
        this.userForm = this._formBuilder.group({
            fullName: [data.user?.fullName || '', Validators.required],
            email: [data.user?.email || '', [Validators.required, Validators.email]],
            role: [data.user?.role || 'Agent', Validators.required],
            department: [data.user?.department || ''],
            status: [data.user?.status || 'Active', Validators.required]
        });
    }

    save(): void {
        if (this.userForm.invalid) {
            return;
        }
        this.matDialogRef.close(this.userForm.value);
    }
}
