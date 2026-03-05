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
    selector: 'app-create',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatSelectModule],
    templateUrl: './create.component.html',
})
export class CreateComponent {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];
    assignType: 'member' | 'team' = 'member';
    selectedAssignee = '';

    priorities = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
    departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
    helpTopics = [
        'General Inquiry',
        'Technical Support',
        'Billing',
        'Sales',
        'Other',
    ];
    slaOptions = ['Default', '4 Hours', '8 Hours', '24 Hours', '48 Hours'];
    roleOptions = ['External', 'Internal', 'Partner', 'VIP'];

    members = [
        { name: 'Alice', avatar: 'A', color: 'bg-indigo-400', image: 'images/avatars/female-01.jpg' },
        { name: 'Jonathan', avatar: 'J', color: 'bg-orange-400', image: 'images/avatars/male-01.jpg' },
        { name: 'Smith', avatar: 'S', color: 'bg-teal-400', image: 'images/avatars/male-02.jpg' },
        { name: 'Vincent', avatar: 'V', color: 'bg-purple-400', image: 'images/avatars/male-03.jpg' },
        { name: 'Chris', avatar: 'C', color: 'bg-blue-400', image: 'images/avatars/male-04.jpg' },
    ];

    teams = [
        { name: 'IT Support', color: 'bg-indigo-400' },
        { name: 'Network Team', color: 'bg-blue-400' },
        { name: 'HR Department', color: 'bg-pink-400' },
        { name: 'Finance Team', color: 'bg-yellow-400' },
        { name: 'Operations', color: 'bg-teal-400' },
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', Validators.required],
            phone: [''],
            extension: [''],
            ticketSource: ['', Validators.required],
            department: [''],
            helpTopic: [''],
            subject: ['', Validators.required],
            issueDetail: ['', Validators.required],
            response: [''],
            markInternal: [false],
            internalNote: [''],
            priority: ['Low'],
            role: ['External'],
            assignType: ['member'],
            assignTo: [''],
            sla: ['Default'],
            notifyOnResponse: [false],
        });
        this.updateAssignOptions();
    }

    assignOptions: any[] = [];

    updateAssignOptions() {
        this.assignOptions = this.assignType === 'member'
            ? this.members.map((m) => ({
                  name: m.name,
                  initial: m.avatar,
                  color: m.color,
                  image: m.image,
              }))
            : this.teams.map((t) => ({
                  name: t.name,
                  initial: t.name.charAt(0),
                  color: t.color,
                  image: null,
              }));
    }

    onAssignTypeChange(): void {
        this.selectedAssignee = '';
        this.form.patchValue({ assignTo: '', assignType: this.assignType });
        this.updateAssignOptions();
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

    getAssigneeImage(name: string): string | null {
        if (!name) return null;
        const member = this.members.find((m: any) => m.name === name);
        return member?.image || null;
    }

    clearAssignee(): void {
        this.selectedAssignee = '';
        this.form.patchValue({ assignTo: '' });
    }

    // Drag & Drop
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
        } else {
            this.form.markAllAsTouched();
        }
    }

    onSaveDraft(): void {
        console.log('Draft saved:', this.form.value);
    }

    onCancel(): void {
        this.router.navigate(['/tickets/data']);
    }

    backToTickets(): void {
        this.router.navigate(['/tickets/data']);
    }
}
