import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TicketService } from '../../../admin/tickets/ticket.service';
import { UserService } from 'app/core/user/user.service';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
    selector: 'app-user-ticket-edit',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MatFormFieldModule,
        MatSelectModule,
    ],
    templateUrl: './edit.component.html',
})
export class UserTicketEditComponent implements OnInit {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];
    existingAttachments: any[] = [];
    deletedAttachmentIds: string[] = [];
    isSubmitting = false;
    isLoading = false;
    currentUser: any = null;
    ticketId: string = '';
    ticketData: any = null;

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
        private route: ActivatedRoute,
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
        });
    }

    ngOnInit(): void {
        // Get ticket ID from route
        this.ticketId = this.route.snapshot.paramMap.get('id') || '';
        
        if (!this.ticketId) {
            this._snackbar.error('Invalid ticket ID');
            this.router.navigate(['/user/tickets']);
            return;
        }

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
            
            // Load ticket data after user is loaded
            this.loadTicketData();
        });
    }

    loadTicketData(): void {
        this.isLoading = true;
        
        const userId = this.currentUser?.id;
        
        this._ticketService.getTicket(this.ticketId, userId)
            .pipe(
                catchError((error) => {
                    console.error('Error loading ticket:', error);
                    
                    if (error.status === 403) {
                        this._snackbar.error('You do not have permission to edit this ticket');
                    } else {
                        this._snackbar.error('Failed to load ticket data');
                    }
                    
                    this.router.navigate(['/user/tickets']);
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    this.ticketData = response.data;
                    
                    console.log('Ticket data loaded:', this.ticketData);
                    console.log('Attachments:', this.ticketData.attachments);
                    
                    // Check if user can edit (only draft or pending)
                    if (this.ticketData.status !== -1 && this.ticketData.status !== 0) {
                        this._snackbar.error('You can only edit tickets with Draft or Pending status');
                        this.router.navigate(['/user/tickets']);
                        return;
                    }
                    
                    // Check if user is the requester
                    if (this.ticketData.requester_id !== this.currentUser?.id) {
                        this._snackbar.error('You can only edit your own tickets');
                        this.router.navigate(['/user/tickets']);
                        return;
                    }
                    
                    this.populateForm();
                }
            });
    }

    populateForm(): void {
        if (!this.ticketData) return;

        this.form.patchValue({
            email: this.ticketData.email || '',
            fullName: this.ticketData.name || '',
            phone: this.ticketData.phone_number || '',
            extension: this.ticketData.extension_number || '',
            ticketSource: this.ticketData.ticket_source || 'Web Portal',
            department: this.ticketData.department_id || '',
            helpTopic: this.ticketData.help_topic || '',
            subject: this.ticketData.subject_issue || '',
            issueDetail: this.ticketData.issue_detail || '',
        });

        // Load existing attachments
        console.log('Loading attachments from ticketData:', this.ticketData.attachments);
        
        if (this.ticketData.attachments) {
            if (Array.isArray(this.ticketData.attachments)) {
                this.existingAttachments = [...this.ticketData.attachments];
                console.log('Existing attachments loaded:', this.existingAttachments);
            } else {
                console.warn('Attachments is not an array:', this.ticketData.attachments);
                this.existingAttachments = [];
            }
        } else {
            console.log('No attachments found in ticket data');
            this.existingAttachments = [];
        }
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

    removeExistingAttachment(attachmentId: string): void {
        // Add to deleted list
        this.deletedAttachmentIds.push(attachmentId);
        // Remove from display
        this.existingAttachments = this.existingAttachments.filter(a => a.id !== attachmentId);
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    }

    getAttachmentUrl(attachment: any): string {
        const backendUrl = 'http://127.0.0.1:9010';
        return `${backendUrl}/storage/${attachment.path.replace('public/', '')}`;
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitTicket(false); // false = not draft, submit as pending
    }

    onSaveDraft(): void {
        // For draft, only require basic fields
        if (!this.form.get('fullName')?.value || !this.form.get('email')?.value) {
            this._snackbar.error('Full name and email are required');
            return;
        }

        this.submitTicket(true); // true = save as draft
    }

    private submitTicket(isDraft: boolean): void {
        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        // Use FormData if there are new files or deleted attachments
        const hasAttachmentChanges = this.uploadedFiles.length > 0 || this.deletedAttachmentIds.length > 0;

        if (hasAttachmentChanges) {
            this.submitWithFormData(isDraft);
        } else {
            this.submitWithJSON(isDraft);
        }
    }

    private submitWithJSON(isDraft: boolean): void {
        // Prepare data for API
        const formValue = this.form.value;
        const ticketData: any = {
            requester_type: 'select_employee', // Default for user tickets
            name: formValue.fullName,
            email: formValue.email,
            phone_number: formValue.phone || '',
            extension_number: formValue.extension || '',
            ticket_source: formValue.ticketSource,
            department_id: formValue.department || '',
            help_topic: formValue.helpTopic || '',
            subject_issue: formValue.subject || '',
            issue_detail: formValue.issueDetail || '',
            priority: null,
            assign_status: 'member',
            status: isDraft ? -1 : 0,
        };

        // Add requester_id and user_id
        if (this.currentUser?.id) {
            ticketData.requester_id = this.currentUser.id;
            ticketData.user_id = this.currentUser.id;
        }

        console.log('Updating ticket data:', ticketData);

        this._ticketService
            .updateTicket(this.ticketId, ticketData)
            .pipe(
                catchError((error) => {
                    console.error('Error updating ticket:', error);
                    this._snackbar.error(
                        error?.error?.message ||
                            `Failed to ${isDraft ? 'save draft' : 'update ticket'}. Please try again.`
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
                        response.message || (isDraft ? 'Draft saved successfully!' : 'Ticket updated successfully!')
                    );
                    this.router.navigate(['/user/tickets']);
                }
            });
    }

    private submitWithFormData(isDraft: boolean): void {
        const formValue = this.form.value;
        const formData = new FormData();

        // Add ticket data
        formData.append('requester_type', 'select_employee'); // Default for user tickets
        formData.append('name', formValue.fullName);
        formData.append('email', formValue.email);
        formData.append('phone_number', formValue.phone || '');
        formData.append('extension_number', formValue.extension || '');
        formData.append('ticket_source', formValue.ticketSource);
        formData.append('department_id', formValue.department || '');
        formData.append('help_topic', formValue.helpTopic || '');
        formData.append('subject_issue', formValue.subject || '');
        formData.append('issue_detail', formValue.issueDetail || '');
        formData.append('priority', '');
        formData.append('assign_status', 'member');
        formData.append('status', isDraft ? '-1' : '0');

        // Add requester_id and user_id
        if (this.currentUser?.id) {
            formData.append('requester_id', this.currentUser.id);
            formData.append('user_id', this.currentUser.id);
        }

        // Add new attachments
        this.uploadedFiles.forEach((file) => {
            formData.append('attachments[]', file, file.name);
        });

        // Add deleted attachment IDs
        this.deletedAttachmentIds.forEach((id) => {
            formData.append('deleted_attachments[]', id);
        });

        console.log('Updating ticket with FormData');

        this._ticketService
            .updateTicket(this.ticketId, formData)
            .pipe(
                catchError((error) => {
                    console.error('Error updating ticket:', error);
                    this._snackbar.error(
                        error?.error?.message ||
                            `Failed to ${isDraft ? 'save draft' : 'update ticket'}. Please try again.`
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
                        response.message || (isDraft ? 'Draft saved successfully!' : 'Ticket updated successfully!')
                    );
                    this.router.navigate(['/user/tickets']);
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/user/tickets']);
    }

    backToTickets(): void {
        this.router.navigate(['/user/tickets']);
    }
}
