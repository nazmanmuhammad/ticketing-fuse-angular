import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-create-access-request',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatSelectModule, TranslocoModule],
    templateUrl: './create.component.html',
})
export class CreateAccessRequestComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    form: FormGroup;
    uploadedFiles: File[] = [];
    isDragging = false;
    assignType: 'member' | 'team' = 'member';
    selectedAssignee = '';

    priorities: any[] = [];
    departments: any[] = [];
    requestTypes: any[] = [];
    accessLevels: any[] = [];
    durationTypes: any[] = [];

    members = [
        { name: 'Alice Smith', avatar: 'A', color: 'bg-indigo-400', image: 'images/avatars/female-09.jpg' },
        { name: 'Bob Jones', avatar: 'B', color: 'bg-orange-400', image: 'images/avatars/male-09.jpg' },
        { name: 'Charlie Day', avatar: 'C', color: 'bg-teal-400', image: 'images/avatars/male-10.jpg' },
        { name: 'Diana Prince', avatar: 'D', color: 'bg-purple-400', image: 'images/avatars/female-10.jpg' },
    ];

    teams = [
        { name: 'IT Support', color: 'bg-indigo-400' },
        { name: 'Security Team', color: 'bg-blue-400' },
        { name: 'Infrastructure', color: 'bg-pink-400' },
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private translocoService: TranslocoService
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
        this.updateAssignOptions();
    }

    ngOnInit(): void {
        this.translocoService.events$
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => {
                if (event.type === 'translationLoadSuccess') {
                    this.updateTranslations();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    updateTranslations(): void {
        this.priorities = [
            { value: 'Low', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_LOW') },
            { value: 'Medium', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_MEDIUM') },
            { value: 'High', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_HIGH') },
            { value: 'Critical', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_CRITICAL') }
        ];

        this.departments = [
            { value: 'IT', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_IT') },
            { value: 'HR', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_HR') },
            { value: 'Finance', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_FINANCE') },
            { value: 'Operations', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_OPERATIONS') },
            { value: 'Marketing', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_MARKETING') }
        ];

        this.requestTypes = [
            { value: 'New Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.TYPE_NEW') },
            { value: 'Change Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.TYPE_CHANGE') },
            { value: 'Revoke Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.TYPE_REVOKE') }
        ];

        this.accessLevels = [
            { value: 'Viewer', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_VIEWER') },
            { value: 'Standard User', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_STANDARD') },
            { value: 'Editor', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_EDITOR') },
            { value: 'Admin Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_ADMIN') }
        ];

        this.durationTypes = [
            { value: 'Temporary Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DURATION_TEMPORARY') },
            { value: 'Permanent Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DURATION_PERMANENT') }
        ];
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
