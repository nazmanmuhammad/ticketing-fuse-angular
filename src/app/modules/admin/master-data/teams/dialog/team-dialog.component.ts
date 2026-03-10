import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Team } from '../team.types';
import { User } from '../../users/user.types';

@Component({
    selector: 'team-dialog',
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
        MatAutocompleteModule,
        MatOptionModule,
        MatCheckboxModule,
        MatIconModule
    ],
    templateUrl: './team-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TeamDialogComponent {
    teamForm: FormGroup;
    mode: 'create' | 'update' = 'create';
    users: User[] = [];
    memberSearch = '';
    memberPanelSearch = '';
    filteredUsersList: User[] = [];
    triggerInput: FormControl<string | null> = new FormControl('');

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<TeamDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { team: Team, users: User[] }
    ) {
        this.mode = data.team ? 'update' : 'create';
        this.users = data.users || [];
        this.filteredUsersList = this.users;
        
        this.teamForm = this._formBuilder.group({
            name: [data.team?.name || '', Validators.required],
            description: [data.team?.description || ''],
            members: [data.team?.members || [], Validators.required]
        });

        this.updateTriggerSummary();
        this.triggerInput.valueChanges.subscribe((val) => {
            const q = (val || '').toString().toLowerCase();
            this.filteredUsersList = this.users.filter(u =>
                (u.fullName || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
        });
    }

    save(): void {
        if (this.teamForm.invalid) {
            return;
        }
        this.matDialogRef.close(this.teamForm.value);
    }

    compareUsers(o1: User, o2: User): boolean {
        return o1.id === o2.id;
    }

    filteredUsers(): User[] {
        const q = (this.memberSearch || '').toLowerCase();
        if (!q) return this.users;
        return this.users.filter(u =>
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }

    applyPanelFilter(): void {
        const q = (this.memberPanelSearch || '').toLowerCase();
        this.filteredUsersList = !q
            ? this.users
            : this.users.filter(u =>
                (u.fullName || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q));
    }

    isSelected(user: User): boolean {
        const arr: User[] = this.teamForm.get('members')?.value || [];
        return !!arr.find(u => u.id === user.id);
    }

    toggleMember(user: User, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        const members: User[] = [...(this.teamForm.get('members')?.value || [])];
        const idx = members.findIndex(u => u.id === user.id);
        if (idx > -1) {
            members.splice(idx, 1);
        } else {
            members.push(user);
        }
        this.teamForm.get('members')?.setValue(members);
        this.teamForm.get('members')?.markAsDirty();
        this.updateTriggerSummary();
    }

    private updateTriggerSummary(): void {
        const members: User[] = this.teamForm.get('members')?.value || [];
        if (members.length === 0) {
            this.triggerInput.setValue('', { emitEvent: false });
            return;
        }
        if (members.length === 1) {
            this.triggerInput.setValue(members[0].fullName, { emitEvent: false });
            return;
        }
        this.triggerInput.setValue(`${members[0].fullName} (+${members.length - 1} other${members.length - 1 > 1 ? 's' : ''})`, { emitEvent: false });
    }

    onTriggerFocus(): void {
        // Allow typing to search
        // Do not clear if already typing
    }

    onTriggerBlur(): void {
        // Restore summary text
        this.updateTriggerSummary();
    }

    onMemberSelected(user: User, trigger: any): void {
        // Toggle the member on selection
        this.toggleMember(user);
        // Reset filter so the list is visible again
        this.triggerInput.setValue('', { emitEvent: true });
        this.filteredUsersList = this.users;
        // Re-open panel for continuous selection
        setTimeout(() => trigger?.openPanel?.());
    }
}
