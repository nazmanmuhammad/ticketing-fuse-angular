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
    selector: 'app-create-access-request',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './create.component.html',
})
export class CreateAccessRequestComponent {
    form: FormGroup;
    uploadedFiles: File[] = [];
    isDragging = false;
    assignType: 'member' | 'team' = 'member';
    selectedAssignee = '';

    priorities = ['Low', 'Medium', 'High', 'Critical'];
    departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
    requestTypes = ['New Access', 'Change Access', 'Revoke Access'];
    accessLevels = ['Viewer', 'Standard User', 'Editor', 'Admin Access'];
    durationTypes = ['Temporary Access', 'Permanent Access'];

    members = [
        { name: 'Alice Smith', avatar: 'A', color: 'bg-indigo-400' },
        { name: 'Bob Jones', avatar: 'B', color: 'bg-orange-400' },
        { name: 'Charlie Day', avatar: 'C', color: 'bg-teal-400' },
        { name: 'Diana Prince', avatar: 'D', color: 'bg-purple-400' },
    ];

    teams = [
        { name: 'IT Support', color: 'bg-indigo-400' },
        { name: 'Security Team', color: 'bg-blue-400' },
        { name: 'Infrastructure', color: 'bg-pink-400' },
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', Validators.required],
            phone: [''],
            department: ['', Validators.required],

            resourceName: ['', Validators.required],
            requestType: ['', Validators.required],
            accessLevel: ['', Validators.required],
            reason: ['', Validators.required],

            durationType: [this.durationTypes[0], Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],

            priority: ['Medium'],
            assignType: ['member'],
            assignTo: [''],

            notifyRequester: [false],
            requireManagerApproval: [false],
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

    onSubmit(): void {
        if (this.form.valid) {
            console.log('Create access request:', this.form.value, this.uploadedFiles);
            this.router.navigate(['/access-requests/data']);
        } else {
            this.form.markAllAsTouched();
        }
    }

    onReset(): void {
        this.form.reset({
            durationType: this.durationTypes[0],
            priority: 'Medium',
            assignType: 'member',
            notifyRequester: false,
            requireManagerApproval: false,
        });
        this.selectedAssignee = '';
        this.uploadedFiles = [];
    }

    onCancel(): void {
        this.router.navigate(['/access-requests/data']);
    }

    backToAccessRequests(): void {
        this.router.navigate(['/access-requests/data']);
    }
}
