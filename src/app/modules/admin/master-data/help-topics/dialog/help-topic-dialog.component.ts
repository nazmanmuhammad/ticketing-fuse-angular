import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HelpTopic } from '../help-topic.types';

@Component({
    selector: 'help-topic-dialog',
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
    templateUrl: './help-topic-dialog.component.html',
    styles: [
        `
        ::ng-deep .mat-mdc-dialog-surface {
            padding: 0 !important;
        }
        `,
    ],
})
export class HelpTopicDialogComponent {
    helpTopicForm: FormGroup;
    mode: 'create' | 'update' = 'create';

    constructor(
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<HelpTopicDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { helpTopic: HelpTopic }
    ) {
        this.mode = data.helpTopic ? 'update' : 'create';
        
        this.helpTopicForm = this._formBuilder.group({
            name: [data.helpTopic?.name || '', Validators.required],
            description: [data.helpTopic?.description || ''],
            status: [data.helpTopic?.status || 'Active', Validators.required]
        });
    }

    save(): void {
        if (this.helpTopicForm.invalid) {
            return;
        }
        this.matDialogRef.close(this.helpTopicForm.value);
    }
}
