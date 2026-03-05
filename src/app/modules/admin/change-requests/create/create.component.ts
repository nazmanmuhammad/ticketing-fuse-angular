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

@Component({
    selector: 'app-create-change-request',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './create.component.html',
})
export class CreateChangeRequestComponent {
    form: FormGroup;
    uploadedFiles: File[] = [];
    isDragging = false;
    assignType: 'member' | 'team' = 'member';
    selectedAssignee = '';

    // Dropdown Data
    applications = [
        'Billing System',
        'Customer Portal',
        'Inventory Management',
        'HR System',
        'Mobile App',
    ];

    priorities = ['Low', 'Medium', 'High', 'Critical'];
    impacts = ['Low', 'Medium', 'High'];
    risks = ['Low', 'Medium', 'High'];
    slaOptions = ['Default', '4 Hours', '8 Hours', '24 Hours', '48 Hours'];

    members = [
        { name: 'Alice Smith', avatar: 'A', color: 'bg-indigo-400' },
        { name: 'Bob Jones', avatar: 'B', color: 'bg-orange-400' },
        { name: 'Charlie Day', avatar: 'C', color: 'bg-teal-400' },
        { name: 'Diana Prince', avatar: 'D', color: 'bg-purple-400' },
    ];

    teams = [
        { name: 'IT Support', color: 'bg-indigo-400' },
        { name: 'Development Team', color: 'bg-blue-400' },
        { name: 'Infrastructure', color: 'bg-pink-400' },
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.form = this.fb.group({
            // User Information
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', Validators.required],
            phone: [''],
            extension: [''],

            // Change Request Details
            subject: ['', Validators.required],
            application: ['', Validators.required],
            description: ['', Validators.required],

            // Assignment & Priority
            priority: ['Low'],
            impact: ['Low'],
            risk: ['Low'],
            assignType: ['member'],
            assignTo: [''],
            response: [''],
            sla: ['Default'],
            notifyOnResponse: [false],
            internalNote: [''],
            markInternal: [false],
        });
    }

    get assignOptions() {
        return this.assignType === 'member'
            ? this.members.map((m) => ({
                  name: m.name,
                  initial: m.avatar,
                  color: m.color,
              }))
            : this.teams.map((t) => ({
                  name: t.name,
                  initial: t.name.charAt(0),
                  color: t.color,
              }));
    }

    onAssignTypeChange(): void {
        this.selectedAssignee = '';
        this.form.patchValue({ assignTo: '', assignType: this.assignType });
    }

    onAssigneeChange(): void {
        this.form.patchValue({ assignTo: this.selectedAssignee });
    }

    getAssigneeColor(name: string): string {
        const all = [
            ...this.members.map((m) => ({ name: m.name, color: m.color })),
            ...this.teams.map((t) => ({ name: t.name, color: t.color })),
        ];
        return all.find((a) => a.name === name)?.color ?? 'bg-indigo-400';
    }

    getAssigneeInitial(name: string): string {
        if (!name) return '';
        const member = this.members.find((m) => m.name === name);
        return member ? member.avatar : name.charAt(0).toUpperCase();
    }

    clearAssignee(): void {
        this.selectedAssignee = '';
        this.form.patchValue({ assignTo: '' });
    }

    // Attachment Methods
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
        if (event.dataTransfer?.files) {
            this.addFiles(Array.from(event.dataTransfer.files));
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.addFiles(Array.from(input.files));
        }
    }

    addFiles(files: File[]): void {
        const validFiles = files.filter(
            (file) => file.size <= 10 * 1024 * 1024
        );
        this.uploadedFiles.push(...validFiles);
    }

    removeFile(index: number): void {
        this.uploadedFiles.splice(index, 1);
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Actions
    onSubmit(): void {
        if (this.form.valid) {
            console.log('Form Submitted', this.form.value, this.uploadedFiles);
            // Simulate API call
            setTimeout(() => {
                this.router.navigate(['/change-requests/data']);
            }, 1000);
        } else {
            this.form.markAllAsTouched();
        }
    }

    onSaveDraft(): void {
        console.log('Draft saved:', this.form.value);
    }

    onReset(): void {
        this.form.reset({
            priority: 'Low',
            assignType: 'member',
        });
        this.selectedAssignee = '';
        this.uploadedFiles = [];
    }

    onCancel(): void {
        this.router.navigate(['/change-requests/data']);
    }

    backToChangeRequests(): void {
        this.router.navigate(['/change-requests/data']);
    }
}
