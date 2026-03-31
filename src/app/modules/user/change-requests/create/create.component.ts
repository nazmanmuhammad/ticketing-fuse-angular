import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-user-change-request-create',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MatFormFieldModule,
        MatSelectModule,
    ],
    templateUrl: './create.component.html',
})
export class UserChangeRequestCreateComponent {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];

    changeTypes = ['Configuration Change', 'Infrastructure Change', 'Application Change', 'Emergency Change'];
    priorities = ['Low', 'Medium', 'High', 'Critical'];
    departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
    impactLevels = ['Low', 'Medium', 'High'];
    riskLevels = ['Low', 'Medium', 'High'];

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.form = this.fb.group({
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            department: [''],
            changeType: ['', Validators.required],
            changeTitle: ['', Validators.required],
            changeDescription: ['', Validators.required],
            justification: ['', Validators.required],
            priority: ['Low'],
            impactLevel: ['Low'],
            riskLevel: ['Low'],
            plannedStartDate: ['', Validators.required],
            plannedEndDate: [''],
            rollbackPlan: [''],
        });
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = true;
    }

    onDragLeave(): void {
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
        const files = event.dataTransfer?.files;
        if (files) this.addFiles(Array.from(files));
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) this.addFiles(Array.from(input.files));
    }

    addFiles(files: File[]): void {
        this.uploadedFiles.push(...files);
    }

    removeFile(index: number): void {
        this.uploadedFiles.splice(index, 1);
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    }

    onSubmit(): void {
        if (this.form.valid) {
            console.log('Submit:', this.form.value);
            this.router.navigate(['/user/change-requests']);
        } else {
            this.form.markAllAsTouched();
        }
    }

    onSaveDraft(): void {
        console.log('Draft saved:', this.form.value);
    }

    onCancel(): void {
        this.router.navigate(['/user/change-requests']);
    }
}
