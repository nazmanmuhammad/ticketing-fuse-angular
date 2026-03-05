import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
        MatIconModule
    ],
    templateUrl: './team-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TeamDialogComponent {
    teamForm: FormGroup;
    mode: 'create' | 'update' = 'create';
    users: User[] = [];

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<TeamDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { team: Team, users: User[] }
    ) {
        this.mode = data.team ? 'update' : 'create';
        this.users = data.users || [];
        
        this.teamForm = this._formBuilder.group({
            name: [data.team?.name || '', Validators.required],
            description: [data.team?.description || ''],
            members: [data.team?.members || [], Validators.required]
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
}
