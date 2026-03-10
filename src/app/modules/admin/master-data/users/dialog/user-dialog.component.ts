import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
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
        MatIconModule,
        MatAutocompleteModule,
        MatOptionModule
    ],
    templateUrl: './user-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class UserDialogComponent {
    userForm: FormGroup;
    mode: 'create' | 'update' = 'create';

    roles = ['Admin', 'Agent', 'User'];
    departments = ['IT', 'Support', 'Sales', 'Operations', 'Finance', 'HR'];
    statuses = ['Active', 'Inactive'];
    users: User[] = [];
    employeeInput: FormControl<string | null> = new FormControl('');
    filteredEmployeesList: User[] = [];
    employeeAutocompleteEnabled = false;
    private employeeChanged = false;

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<UserDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { user: User, users?: User[] }
    ) {
        this.mode = data.user ? 'update' : 'create';
        this.users = data.users || [];
        this.filteredEmployeesList = this.users;
        this.userForm = this._formBuilder.group({
            employee: [this._prefillEmployee(data.user) || null, Validators.required],
            role: [data.user?.role || 'Agent', Validators.required],
            department: [data.user?.department || ''],
            status: [data.user?.status || 'Active', Validators.required]
        });

        // Prefill input display if edit
        const emp = this.userForm.get('employee')?.value as User | null;
        if (emp) {
            this.employeeInput.setValue(`${emp.fullName} (${emp.email})`);
        }

        this.employeeInput.valueChanges.subscribe((val) => {
            const q = (val || '').toString().toLowerCase();
            this.filteredEmployeesList = this.users.filter(u =>
                (u.fullName || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
        });
    }

    save(): void {
        if (this.userForm.invalid) {
            return;
        }
        const value = this.userForm.value;
        const emp = value.employee as User | null;
        if (!emp) {
            return;
        }
        this.matDialogRef.close({
            fullName: emp?.fullName,
            email: emp?.email,
            role: value.role,
            department: value.department,
            status: value.status
        });
    }

    onEmployeeSelected(user: User): void {
        this.userForm.get('employee')?.setValue(user);
        this.employeeInput.setValue(this.employeeDisplay(user), { emitEvent: false });
        this.employeeChanged = true;
    }

    enableEmployeeAutocomplete(trigger: any): void {
        if (!this.employeeAutocompleteEnabled) {
            this.employeeAutocompleteEnabled = true;
        }
        // Reset filter so user sees all options immediately
        this.employeeChanged = false;
        this.employeeInput.setValue('', { emitEvent: true });
        this.filteredEmployeesList = this.users;
        trigger?.openPanel?.();
    }

    onEmployeePanelClosed(): void {
        if (this.employeeChanged) {
            return;
        }
        // Restore label for the currently selected employee
        const emp = this.userForm.get('employee')?.value as User | null;
        if (emp) {
            this.employeeInput.setValue(this.employeeDisplay(emp), { emitEvent: false });
        } else {
            this.employeeInput.setValue('', { emitEvent: false });
        }
    }

    compareUsers(o1: User, o2: User): boolean {
        return o1?.id === o2?.id;
    }

    private _prefillEmployee(user?: User): User | null {
        if (!user || !this.users?.length) return null;
        return this.users.find(u => u.email === user.email || u.id === user.id) || null;
    }

    employeeDisplay = (user: User | null): string => {
        if (!user) return '';
        return `${user.fullName} (${user.email})`;
    };
}
