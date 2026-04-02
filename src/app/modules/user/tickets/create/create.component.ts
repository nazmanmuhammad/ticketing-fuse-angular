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
import { TicketService, TicketCreateRequest, PRIORITY_MAP } from '../../../admin/tickets/ticket.service';
import { UserService } from 'app/core/user/user.service';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
    selector: 'app-user-ticket-create',
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
export class UserTicketCreateComponent {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];
    isSubmitting = false;
    currentUser: any = null;

    priorities = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
    departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
    helpTopics = [
        'General Inquiry',
        'Technical Support',
        'Billing',
        'Sales',
        'Other',
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private _ticketService: TicketService,
        private _userService: UserService,
        private _snackbar: SnackbarService,
    ) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', Validators.required],
            phone: [''],
            extension: [''],
            ticketSource: ['Web Portal', Validators.required],
            department: [''],
            helpTopic: [''],
            subject: ['', Validators.required],
            issueDetail: ['', Validators.required],
            priority: ['Low'],
        });

        // Get current user info
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
            // Pre-fill form with user data
            if (user) {
                this.form.patchValue({
                    email: user.email || '',
                    fullName: user.name || '',
                });
            }
        });
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
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        // Prepare data for API
        const formValue = this.form.value;
        const ticketData: TicketCreateRequest = {
            name: formValue.fullName,
            email: formValue.email,
            phone_number: formValue.phone || '',
            extension_number: formValue.extension || '',
            ticket_source: formValue.ticketSource,
            department_id: formValue.department || '',
            help_topic: formValue.helpTopic || '',
            subject_issue: formValue.subject,
            issue_detail: formValue.issueDetail,
            priority: PRIORITY_MAP[formValue.priority] ?? 0, // Convert string to number
            assign_status: 'member', // Default for user
        };

        // Add requester_id from current user
        if (this.currentUser?.id) {
            ticketData.requester_id = this.currentUser.id;
        }

        console.log('Submitting ticket data:', ticketData);

        this._ticketService
            .createTicket(ticketData)
            .pipe(
                catchError((error) => {
                    console.error('Error creating ticket:', error);
                    this._snackbar.error(
                        error?.error?.message ||
                            'Failed to create ticket. Please try again.'
                    );
                    return of(null);
                }),
                finalize(() => {
                    this.isSubmitting = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success(
                        response.message || 'Ticket created successfully!'
                    );
                    this.router.navigate(['/user/tickets']);
                }
            });
    }

    onSaveDraft(): void {
        console.log('Draft saved:', this.form.value);
    }

    onCancel(): void {
        this.router.navigate(['/user/tickets']);
    }

    backToTickets(): void {
        this.router.navigate(['/user/tickets']);
    }
}
