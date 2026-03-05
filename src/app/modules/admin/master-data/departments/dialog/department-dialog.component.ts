import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Department } from '../department.types';
import { User } from '../../users/user.types';

@Component({
    selector: 'department-dialog',
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
    templateUrl: './department-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class DepartmentDialogComponent {
    departmentForm: FormGroup;
    mode: 'create' | 'update' = 'create';
    users: User[] = [];

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<DepartmentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { department: Department, users: User[] }
    ) {
        this.mode = data.department ? 'update' : 'create';
        this.users = data.users || [];
        
        this.departmentForm = this._formBuilder.group({
            name: [data.department?.name || '', Validators.required],
            description: [data.department?.description || ''],
            head: [data.department?.head || null],
            status: [data.department?.status || 'Active', Validators.required]
        });
    }

    save(): void {
        if (this.departmentForm.invalid) {
            return;
        }
        this.matDialogRef.close(this.departmentForm.value);
    }

    compareUsers(o1: User, o2: User): boolean {
        return o1?.id === o2?.id;
    }
}
