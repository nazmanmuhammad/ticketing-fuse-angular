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
    selector: 'app-user-job-request-create',
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
export class UserJobRequestCreateComponent {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];

    jobTypes = ['Full Time', 'Part Time', 'Contract', 'Internship'];
    priorities = ['Low', 'Medium', 'High', 'Urgent'];
    departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales'];
    employmentTypes = ['Permanent', 'Temporary', 'Contract'];

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.form = this.fb.group({
            requesterName: ['', Validators.required],
            requesterEmail: ['', [Validators.required, Validators.email]],
            requesterPhone: [''],
            department: ['', Validators.required],
            jobTitle: ['', Validators.required],
            jobType: ['', Validators.required],
            employmentType: ['Permanent'],
            numberOfPositions: [1, [Validators.required, Validators.min(1)]],
            priority: ['Medium'],
            jobDescription: ['', Validators.required],
            requirements: ['', Validators.required],
            responsibilities: [''],
            salaryRange: [''],
            startDate: ['', Validators.required],
            justification: ['', Validators.required],
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
            this.router.navigate(['/user/job-requests']);
        } else {
            this.form.markAllAsTouched();
        }
    }

    onSaveDraft(): void {
        console.log('Draft saved:', this.form.value);
    }

    onCancel(): void {
        this.router.navigate(['/user/job-requests']);
    }
}
