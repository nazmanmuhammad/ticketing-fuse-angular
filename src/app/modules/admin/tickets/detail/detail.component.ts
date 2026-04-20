import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketService } from '../ticket.service';
import { catchError, finalize, of, Subject, switchMap } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { ConfirmationDialogService } from 'app/core/services/confirmation-dialog.service';
import { SafePipe } from 'app/shared/pipes/safe.pipe';
import { UserService } from 'app/core/user/user.service';
import { TranslocoService } from '@jsverse/transloco';
import { EditApprovalDialogComponent } from './edit-approval-dialog/edit-approval-dialog.component';
import { ApprovalNotesDialogComponent } from './approval-notes-dialog/approval-notes-dialog.component';
import { ApprovalNotesViewDialogComponent } from './approval-notes-view-dialog/approval-notes-view-dialog.component';

interface Comment {
    id: string;
    author: string;
    user?: any; // Full user object with photo
    text: string;
    at: string;
    isInternal?: boolean;
    attachments?: { name: string; size: string }[];
    replies?: Comment[];
}

@Component({
    selector: 'app-ticket-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatTooltipModule, SafePipe],
    templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit, AfterViewInit {
    @ViewChild('commentList') commentListElement?: ElementRef;
    
    id = '';
    ticket: any = null;
    isLoading = false;
    internalNote = false;
    newComment = '';
    createdByUser: string = '';
    createdAt: string = '';
    currentUser: any = null;

    // Attach state (simulated)
    pendingFiles: { name: string; size: string }[] = [];
    comments: Comment[] = [];
    activity: { text: string; at: string; action: string; user: { name: string; photo: string | null; email: string } | null }[] = [];

    // Preview modal state
    showPreviewModal = false;
    previewAttachment: any = null;
    previewZoom = 1;
    previewRotation = 0;

    // Comment state
    newCommentText = '';
    newCommentInternal = false;
    newCommentFiles: File[] = [];
    isSubmittingComment = false;

    // Reply state
    replyingToId: string | null = null;
    replyText = '';
    replyFiles: File[] = [];
    isSubmittingReply = false;

    // Scroll state
    showScrollToBottom = false;

    // Assign technical state
    showAssignTechnical = false;
    selectedTechnicalId = '';
    technicalUsers: any[] = [];
    isLoadingTechnical = false;
    isAssigningTechnical = false;
    technicalSearchQuery = '';
    technicalDropdownOpen = false;
    selectedTechnical: any = null;
    private technicalSearch$ = new Subject<string>();
    
    // Avatar colors
    private readonly avatarColors = [
        'bg-indigo-400', 'bg-orange-400', 'bg-teal-400', 'bg-purple-400',
        'bg-blue-400', 'bg-pink-400', 'bg-green-400', 'bg-red-400',
        'bg-cyan-400', 'bg-amber-400', 'bg-lime-500', 'bg-rose-400',
    ];

    private readonly backendApiUrl: string;
    private readonly hrisApiUrl: string;

    private readonly _hrisApiUrl: string =
        (globalThis as any)?.__env?.HRIS_API_URL ||
        (globalThis as any)?.process?.env?.HRIS_API_URL ||
        (globalThis as any)?.HRIS_API_URL ||
        'https://back.siglab.co.id';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private _ticketService: TicketService,
        private _snackbar: SnackbarService,
        private _userService: UserService,
        private _httpClient: HttpClient,
        private _elRef: ElementRef,
        private _confirmDialog: ConfirmationDialogService,
        private _translocoService: TranslocoService,
        private _dialog: MatDialog
    ) {
        this.backendApiUrl =
            (globalThis as any)?.__env?.API_URL ||
            (globalThis as any)?.process?.env?.API_URL ||
            (globalThis as any)?.API_URL ||
            'http://127.0.0.1:9010/api';

        this.hrisApiUrl =
            (globalThis as any)?.__env?.HRIS_API_URL ||
            (globalThis as any)?.process?.env?.HRIS_API_URL ||
            (globalThis as any)?.HRIS_API_URL ||
            'https://back.siglab.co.id';
        
        // Debounced search for technical users
        this.technicalSearch$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((query) => {
                this.loadTechnicalUsers(query);
            });
    }

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('id') ?? '';
        console.log('Detail Component - Ticket ID:', this.id);
        
        // Get current user from UserService (which calls me-validation)
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
            console.log('Current User from UserService:', this.currentUser);
        });
        
        if (this.id) {
            this.loadTicketDetail();
        }
    }

    ngAfterViewInit(): void {
        // Setup scroll listener for comment list
        if (this.commentListElement) {
            const element = this.commentListElement.nativeElement;
            element.addEventListener('scroll', () => {
                this.onCommentScroll();
            });
        }
    }

    onCommentScroll(): void {
        if (!this.commentListElement) return;
        
        const element = this.commentListElement.nativeElement;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        
        // Show "scroll to bottom" button if user scrolled up more than 100px from bottom
        this.showScrollToBottom = (scrollHeight - scrollTop - clientHeight) > 100;
    }

    scrollToBottom(): void {
        if (!this.commentListElement) return;
        
        const element = this.commentListElement.nativeElement;
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    }

    loadTicketDetail(): void {
        console.log('Loading ticket detail for ID:', this.id);
        this.isLoading = true;
        
        // Get current user ID
        const userId = this.currentUser?.id;
        
        this._ticketService.getTicket(this.id, userId)
            .pipe(
                catchError((error) => {
                    console.error('Error loading ticket:', error);
                    
                    // Handle 403 Forbidden (draft ticket access denied)
                    if (error.status === 403) {
                        this._snackbar.error('You do not have permission to view this draft ticket');
                    } else {
                        this._snackbar.error('Failed to load ticket details');
                    }
                    
                    this.router.navigate(['/tickets/data']);
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                console.log('API Response:', response);
                if (response && response.status && response.data) {
                    this.ticket = response.data;
                    console.log('Ticket data loaded:', this.ticket);
                    console.log('Subject Issue:', this.ticket.subject_issue);
                    console.log('Issue Detail:', this.ticket.issue_detail);
                    
                    // Load comments from ticket data (Facebook-style flat structure)
                    if (this.ticket.comments && Array.isArray(this.ticket.comments)) {
                        this.comments = this.ticket.comments.map((c: any) => ({
                            id: c.id,
                            author: c.user?.name || 'Unknown',
                            user: c.user, // Include full user object for photo
                            text: c.comment,
                            at: this.formatDate(c.created_at),
                            isInternal: c.is_internal,
                            attachments: c.attachments?.map((a: any) => ({
                                id: a.id,
                                name: a.name,
                                size: this.formatFileSize(a.size),
                                mime: a.mime,
                                path: a.path
                            })) || [],
                            // Only include direct replies (1 level deep, Facebook-style)
                            replies: c.replies?.map((r: any) => ({
                                id: r.id,
                                author: r.user?.name || 'Unknown',
                                user: r.user, // Include full user object for photo
                                text: r.comment,
                                at: this.formatDate(r.created_at),
                                attachments: r.attachments?.map((a: any) => ({
                                    id: a.id,
                                    name: a.name,
                                    size: this.formatFileSize(a.size),
                                    mime: a.mime,
                                    path: a.path
                                })) || [],
                                replies: [] // No nested replies in Facebook-style
                            })) || []
                        }));
                    }
                    
                    // Get creator info from ticket_track with action 'created'
                    if (this.ticket.ticket_track && Array.isArray(this.ticket.ticket_track)) {
                        const createdTrack = this.ticket.ticket_track.find((track: any) => track.action === 'created');
                        if (createdTrack) {
                            this.createdByUser = createdTrack.user?.name || 'Unknown';
                            this.createdAt = createdTrack.created_at;
                        } else {
                            // Fallback if no 'created' track found
                            this.createdByUser = this.ticket.name || 'Unknown';
                            this.createdAt = this.ticket.created_at;
                        }
                    } else {
                        // Fallback if no ticket_track data
                        this.createdByUser = this.ticket.name || 'Unknown';
                        this.createdAt = this.ticket.created_at;
                    }
                    
                    // Map ticket_track to activity log
                    if (this.ticket.ticket_track && Array.isArray(this.ticket.ticket_track)) {
                        this.activity = this.ticket.ticket_track.map((track: any) => {
                            // Use description from backend directly
                            // Backend already provides the correct description for all actions
                            let text = track.description || 'Activity';
                            
                            return {
                                text: text,
                                at: this.formatDate(track.created_at),
                                action: track.action || 'updated',
                                user: track.user ? {
                                    name: track.user.name || 'Unknown',
                                    photo: track.user.photo || null,
                                    email: track.user.email || ''
                                } : null
                            };
                        });
                    } else {
                        // Fallback if no ticket_track data
                        this.activity = [
                            { 
                                text: 'Ticket created', 
                                at: this.formatDate(this.ticket.created_at),
                                action: 'created',
                                user: null
                            }
                        ];
                    }
                }
            });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getPriorityLabel(priority: number): string {
        const labels = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
        return labels[priority] || 'Medium';
    }

    getStatusLabel(status: number): string {
        const labels = ['Pending', 'Processing', 'Resolved', 'Closed'];
        return labels[status] || 'Pending';
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    getAvatarUrl(photo: string | null | undefined): string {
        if (!photo) {
            return 'assets/images/avatars/male-01.jpg';
        }
        
        const photoBase = this._hrisApiUrl
            .replace(/\/$/, '')
            .replace(/\/api$/, '');
        
        return `${photoBase}/assets/img/user/${photo}`;
    }

    getAttachmentUrl(path: string): string {
        if (!path) return '';
        
        // This method is no longer used for direct download
        // Kept for backward compatibility
        const cleanPath = path.replace(/^public\//, '');
        const backendUrl = (globalThis as any)?.__env?.API_URL ||
            (globalThis as any)?.process?.env?.API_URL ||
            (globalThis as any)?.API_URL ||
            'http://127.0.0.1:9010/api';
        
        const baseUrl = backendUrl.replace(/\/api$/, '');
        return `${baseUrl}/storage/${cleanPath}`;
    }

    getAttachmentPreviewUrl(path: string): string {
        if (!path) return '';
        
        // Remove 'public/' prefix and construct storage URL
        const cleanPath = path.replace(/^public\//, '');
        const backendUrl = (globalThis as any)?.__env?.API_URL ||
            (globalThis as any)?.process?.env?.API_URL ||
            (globalThis as any)?.API_URL ||
            'http://127.0.0.1:9010/api';
        
        // For preview, use storage URL
        const baseUrl = backendUrl.replace(/\/api$/, '');
        return `${baseUrl}/storage/${cleanPath}`;
    }

    getAttachmentPreviewUrlById(attachmentId: string): string {
        const backendUrl = (globalThis as any)?.__env?.API_URL ||
            (globalThis as any)?.process?.env?.API_URL ||
            (globalThis as any)?.API_URL ||
            'http://127.0.0.1:9010/api';
        
        return `${backendUrl}/attachments/${attachmentId}/view`;
    }

    getAttachmentDownloadUrl(attachmentId: string): string {
        const backendUrl = (globalThis as any)?.__env?.API_URL ||
            (globalThis as any)?.process?.env?.API_URL ||
            (globalThis as any)?.API_URL ||
            'http://127.0.0.1:9010/api';
        
        return `${backendUrl}/attachments/${attachmentId}/download`;
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    }

    canStartProcess(): boolean {
        if (!this.ticket || !this.currentUser) {
            return false;
        }
        
        // Check if current user's hris_user_id matches pic_technical's hris_user_id
        if (this.ticket.pic_technical && this.currentUser.hris_user_id) {
            return this.ticket.pic_technical.hris_user_id === this.currentUser.hris_user_id;
        }
        
        return false;
    }

    // Preview modal methods
    openPreview(attachment: any): void {
        this.previewAttachment = attachment;
        this.showPreviewModal = true;
        this.previewZoom = 1;
        this.previewRotation = 0;
        
        // Debug: log the URL being used
        console.log('Preview URL (by ID):', this.getAttachmentPreviewUrlById(attachment.id));
        console.log('Preview URL (by path):', this.getAttachmentPreviewUrl(attachment.path));
        console.log('Attachment:', attachment);
    }

    closePreview(): void {
        this.showPreviewModal = false;
        this.previewAttachment = null;
        this.previewZoom = 1;
        this.previewRotation = 0;
    }

    zoomIn(): void {
        if (this.previewZoom < 3) {
            this.previewZoom += 0.25;
        }
    }

    zoomOut(): void {
        if (this.previewZoom > 0.5) {
            this.previewZoom -= 0.25;
        }
    }

    resetZoom(): void {
        this.previewZoom = 1;
        this.previewRotation = 0;
    }

    rotateImage(): void {
        this.previewRotation = (this.previewRotation + 90) % 360;
    }

    downloadAttachment(attachment: any): void {
        const url = this.getAttachmentDownloadUrl(attachment.id);
        window.open(url, '_blank');
    }

    isImageFile(attachment: any): boolean {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const mime = (attachment.mime || '').toLowerCase();
        return imageExtensions.includes(mime);
    }

    isPdfFile(attachment: any): boolean {
        return (attachment.mime || '').toLowerCase() === 'pdf';
    }

    getFileIcon(attachment: any): string {
        const mime = (attachment.mime || '').toLowerCase();
        
        if (this.isImageFile(attachment)) {
            return 'image';
        } else if (this.isPdfFile(attachment)) {
            return 'pdf';
        } else if (['doc', 'docx'].includes(mime)) {
            return 'word';
        } else if (['xls', 'xlsx'].includes(mime)) {
            return 'excel';
        } else if (['ppt', 'pptx'].includes(mime)) {
            return 'powerpoint';
        } else if (['zip', 'rar', '7z'].includes(mime)) {
            return 'archive';
        }
        
        return 'file';
    }

    startReply(commentId: string): void {
        this.replyingToId = this.replyingToId === commentId ? null : commentId;
        this.replyText = '';
        this.replyFiles = [];
    }

    cancelReply(): void {
        this.replyingToId = null;
        this.replyText = '';
        this.replyFiles = [];
    }

    submitReply(comment: Comment): void {
        if (!this.replyText.trim() || !this.ticket) return;
        
        if (!this.currentUser || !this.currentUser.id) {
            this._snackbar.error('User not authenticated');
            return;
        }
        
        this.isSubmittingReply = true;

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('commentable_type', 'Ticket');
        formData.append('commentable_id', this.ticket.id);
        formData.append('user_id', this.currentUser.id);
        formData.append('comment', this.replyText.trim());
        formData.append('is_internal', '0'); // Send as '0' for false
        formData.append('parent_id', comment.id); // Set parent comment ID

        // Append files if any
        if (this.replyFiles.length > 0) {
            this.replyFiles.forEach((file) => {
                formData.append('attachments[]', file, file.name);
            });
        }

        console.log('Submitting reply to comment:', comment.id);

        this._ticketService.createComment(formData)
            .pipe(
                catchError((error) => {
                    console.error('Error creating reply:', error);
                    this._snackbar.error('Failed to add reply');
                    return of(null);
                }),
                finalize(() => {
                    this.isSubmittingReply = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    // Add new reply to the comment
                    const newReply: Comment = {
                        id: response.data.id,
                        author: response.data.user?.name || 'You',
                        user: response.data.user, // Include full user object
                        text: response.data.comment,
                        at: 'Just now',
                        isInternal: false,
                        attachments: response.data.attachments?.map((a: any) => ({
                            id: a.id,
                            name: a.name,
                            size: this.formatFileSize(a.size),
                            mime: a.mime,
                            path: a.path
                        })) || [],
                        replies: []
                    };
                    
                    if (!comment.replies) {
                        comment.replies = [];
                    }
                    comment.replies.push(newReply);
                    
                    // Reset form
                    this.replyingToId = null;
                    this.replyText = '';
                    this.replyFiles = [];
                    
                    this._snackbar.success('Reply added successfully');
                }
            });
    }

    // Removed submitNestedReply - using Facebook-style flat structure

    onReplyFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.replyFiles.push(...Array.from(input.files));
        }
    }

    removeReplyFile(index: number): void {
        this.replyFiles.splice(index, 1);
    }

    simulateAttach(): void {
        // Simulate picking a file
        this.pendingFiles.push({
            name: `attachment_${this.pendingFiles.length + 1}.pdf`,
            size: '256 KB',
        });
    }

    removeAttach(index: number): void {
        this.pendingFiles.splice(index, 1);
    }

    addComment(): void {
        if (!this.newCommentText.trim() || !this.ticket) return;
        
        if (!this.currentUser || !this.currentUser.id) {
            this._snackbar.error('User not authenticated');
            return;
        }
        
        this.isSubmittingComment = true;

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('commentable_type', 'Ticket');
        formData.append('commentable_id', this.ticket.id);
        formData.append('user_id', this.currentUser.id); // Use ID from me-validation
        formData.append('comment', this.newCommentText.trim());
        formData.append('is_internal', this.newCommentInternal ? '1' : '0');

        // Append files if any
        if (this.newCommentFiles.length > 0) {
            this.newCommentFiles.forEach((file) => {
                formData.append('attachments[]', file, file.name);
            });
        }

        console.log('Submitting comment with user_id:', this.currentUser.id);

        this._ticketService.createComment(formData)
            .pipe(
                catchError((error) => {
                    console.error('Error creating comment:', error);
                    this._snackbar.error('Failed to add comment');
                    return of(null);
                }),
                finalize(() => {
                    this.isSubmittingComment = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    // Add new comment to the list
                    const newComment: Comment = {
                        id: response.data.id,
                        author: response.data.user?.name || 'You',
                        user: response.data.user, // Include full user object
                        text: response.data.comment,
                        at: 'Just now',
                        isInternal: response.data.is_internal,
                        attachments: response.data.attachments?.map((a: any) => ({
                            id: a.id,
                            name: a.name,
                            size: this.formatFileSize(a.size),
                            mime: a.mime,
                            path: a.path
                        })) || [],
                        replies: []
                    };
                    
                    this.comments.unshift(newComment);
                    
                    // Reset form
                    this.newCommentText = '';
                    this.newCommentInternal = false;
                    this.newCommentFiles = [];
                    
                    this._snackbar.success('Comment added successfully');
                    
                    // Auto scroll to top (where new comment is)
                    setTimeout(() => {
                        if (this.commentListElement) {
                            this.commentListElement.nativeElement.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        }
                    }, 100);
                }
            });
    }

    onCommentFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.newCommentFiles.push(...Array.from(input.files));
        }
    }

    removeCommentFile(index: number): void {
        this.newCommentFiles.splice(index, 1);
    }

    getApprovalProgress(): number {
        return 0; // Can be implemented later with approval system
    }
    
    approvedCount(): number {
        return 0; // Can be implemented later with approval system
    }
    
    approvalsTotal(): number {
        return 0; // Can be implemented later with approval system
    }

    getTotalCommentCount(): number {
        let total = this.comments.length;
        this.comments.forEach(comment => {
            if (comment.replies && comment.replies.length > 0) {
                total += comment.replies.length;
            }
        });
        return total;
    }

    startProcess(): void {
        if (!this.ticket || !this.currentUser) {
            this._snackbar.error('Unable to start process');
            return;
        }

        const payload = {
            start_process: true,
            user_id: this.currentUser.id
        };

        this._ticketService.updateTicket(this.ticket.id, payload)
            .pipe(
                catchError((error) => {
                    console.error('Error starting process:', error);
                    this._snackbar.error('Failed to start process');
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success('Process started successfully');
                    this.loadTicketDetail();
                }
            });
    }

    resolveTicket(): void {
        if (!this.ticket || !this.currentUser) {
            this._snackbar.error('Unable to resolve ticket');
            return;
        }

        const payload = {
            resolve_ticket: true,
            user_id: this.currentUser.id
        };

        this._ticketService.updateTicket(this.ticket.id, payload)
            .pipe(
                catchError((error) => {
                    console.error('Error resolving ticket:', error);
                    this._snackbar.error('Failed to resolve ticket');
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success('Ticket resolved successfully');
                    this.loadTicketDetail();
                }
            });
    }

    closeTicket(): void {
        if (!this.ticket || !this.currentUser) {
            this._snackbar.error('Unable to close ticket');
            return;
        }

        this._confirmDialog
            .confirm({
                title: 'Close Ticket',
                message: 'Are you sure you want to close this ticket? This action will mark the ticket as completed.',
                confirmText: 'Yes, Close',
                cancelText: 'Cancel',
                type: 'warning'
            })
            .pipe(
                switchMap((confirmed) => {
                    if (confirmed) {
                        const payload = {
                            close_ticket: true,
                            user_id: this.currentUser.id
                        };
                        return this._ticketService.updateTicket(this.ticket.id, payload).pipe(
                            catchError((error) => {
                                console.error('Error closing ticket:', error);
                                this._snackbar.error('Failed to close ticket');
                                return of(null);
                            })
                        );
                    }
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success('Ticket closed successfully');
                    this.loadTicketDetail();
                }
            });
    }

    reopenTicket(): void {
        if (!this.ticket || !this.currentUser) {
            this._snackbar.error('Unable to reopen ticket');
            return;
        }

        // Can reopen if status is Closed (3) or Cancelled (4)
        if (this.ticket.status !== 3 && this.ticket.status !== 4) {
            this._snackbar.error('Ticket can only be reopened when status is Closed or Cancelled');
            return;
        }

        this._confirmDialog
            .confirm({
                title: 'Reopen Ticket',
                message: 'Are you sure you want to reopen this ticket? The ticket status will be changed to Process.',
                confirmText: 'Yes, Reopen',
                cancelText: 'Cancel',
                type: 'info'
            })
            .pipe(
                switchMap((confirmed) => {
                    if (confirmed) {
                        const payload = {
                            reopen: true,
                            user_id: this.currentUser.id
                        };
                        return this._ticketService.updateTicket(this.ticket.id, payload).pipe(
                            catchError((error) => {
                                console.error('Error reopening ticket:', error);
                                this._snackbar.error('Failed to reopen ticket');
                                return of(null);
                            })
                        );
                    }
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success('Ticket reopened successfully');
                    this.loadTicketDetail();
                }
            });
    }

    cancelTicket(): void {
        if (!this.ticket || !this.currentUser) {
            this._snackbar.error('Unable to cancel ticket');
            return;
        }

        // Only allow cancel if status is NOT Closed (3) or Cancelled (4)
        if (this.ticket.status === 3 || this.ticket.status === 4) {
            this._snackbar.error('Ticket can only be cancelled when status is not Closed or Cancelled');
            return;
        }

        this._confirmDialog
            .confirm({
                title: this._translocoService.translate('TICKETS.MESSAGES.CANCEL_CONFIRM_TITLE'),
                message: this._translocoService.translate('TICKETS.MESSAGES.CANCEL_CONFIRM_MESSAGE'),
                confirmText: this._translocoService.translate('TICKETS.BUTTONS.CANCEL_TICKET'),
                cancelText: this._translocoService.translate('TICKETS.BUTTONS.CANCEL'),
                type: 'warning'
            })
            .pipe(
                switchMap((confirmed) => {
                    if (confirmed) {
                        const payload = {
                            cancel_ticket: true,
                            user_id: this.currentUser.id
                        };
                        return this._ticketService.updateTicket(this.ticket.id, payload).pipe(
                            catchError((error) => {
                                console.error('Error cancelling ticket:', error);
                                this._snackbar.error(
                                    error?.error?.message ||
                                        this._translocoService.translate('TICKETS.MESSAGES.CANCEL_FAILED')
                                );
                                return of(null);
                            })
                        );
                    }
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success(this._translocoService.translate('TICKETS.MESSAGES.CANCELLED_SUCCESS'));
                    this.loadTicketDetail();
                }
            });
    }

    toggleAssignTechnical(): void {
        this.showAssignTechnical = !this.showAssignTechnical;
        if (this.showAssignTechnical) {
            this.technicalSearchQuery = '';
            this.technicalDropdownOpen = false;
            this.selectedTechnical = null;
            if (this.technicalUsers.length === 0) {
                this.loadTechnicalUsers();
            }
        }
    }

    canAssignTechnical(): boolean {
        if (!this.currentUser || !this.ticket) {
            return false;
        }

        // If ticket already has pic_technical_id
        if (this.ticket.pic_technical_id) {
            // Only the current pic_technical can reassign
            return this.ticket.pic_technical_id === this.currentUser.id;
        }

        // If no pic_technical_id, only Agent role can assign
        // Role: 1 = Agent, 2 = Technical, 3 = Admin
        return this.currentUser.role === 1;
    }

    // Check if user can see Actions button
    canSeeActions(): boolean {
        if (!this.currentUser || !this.ticket) {
            return false;
        }

        // Show if user is pic_technical
        if (this.ticket.pic_technical_id === this.currentUser.id) {
            return true;
        }

        // Show if user is requester
        if (this.ticket.requester?.id === this.currentUser.id) {
            return true;
        }

        return false;
    }

    // Check if user is pic_technical
    isPicTechnical(): boolean {
        if (!this.currentUser || !this.ticket) {
            return false;
        }
        return this.ticket.pic_technical_id === this.currentUser.id;
    }

    // Check if user is requester
    isRequester(): boolean {
        if (!this.currentUser || !this.ticket) {
            return false;
        }
        // Check against requester.id (not pic_requester_id)
        return this.ticket.requester?.id === this.currentUser.id;
    }

    toggleTechnicalDropdown(): void {
        this.technicalDropdownOpen = !this.technicalDropdownOpen;
        if (this.technicalDropdownOpen) {
            this.technicalSearchQuery = '';
            if (this.technicalUsers.length === 0) {
                this.loadTechnicalUsers();
            }
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.technicalDropdownOpen) return;
        const target = event.target as HTMLElement;
        const dropdownContainer = this._elRef.nativeElement.querySelector('.technical-dropdown-container');
        if (dropdownContainer && !dropdownContainer.contains(target)) {
            this.technicalDropdownOpen = false;
        }
    }

    onTechnicalSearchInput(): void {
        this.technicalSearch$.next(this.technicalSearchQuery);
    }

    loadTechnicalUsers(search: string = ''): void {
        this.isLoadingTechnical = true;
        const base = this.backendApiUrl.replace(/\/$/, '');
        const searchTrim = search.trim();

        let params = new HttpParams().set('per_page', '50');
        if (searchTrim) {
            params = params.set('search', searchTrim);
        }

        this._httpClient.get<any>(`${base}/users`, { params })
            .pipe(
                catchError((error) => {
                    console.error('Error loading technical users:', error);
                    this._snackbar.error('Failed to load technical users');
                    return of(null);
                }),
                finalize(() => {
                    this.isLoadingTechnical = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    const photoBase = this.hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
                    this.technicalUsers = response.data
                        .filter((row: any) => {
                            const role = Number(row?.role ?? 0);
                            return role === 1 || role === 2; // Agent or Technical
                        })
                        .map((row: any, index: number) => ({
                            id: row?.id,
                            name: row?.name ?? '',
                            email: row?.email ?? '',
                            photo: row?.photo || '',
                            avatar: row?.photo 
                                ? `${photoBase}/assets/img/user/${row.photo}` 
                                : null,
                            initial: this.getInitialOf(row?.name ?? ''),
                            color: this.avatarColors[index % this.avatarColors.length]
                        }));
                }
            });
    }

    selectTechnical(user: any): void {
        this.selectedTechnical = user;
        this.technicalDropdownOpen = false;
        this.technicalSearchQuery = '';
    }

    clearTechnical(): void {
        this.selectedTechnical = null;
    }

    getInitialOf(name: string): string {
        return (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    }

    assignTechnical(): void {
        if (!this.selectedTechnical || !this.ticket) {
            this._snackbar.error('Please select a technical user');
            return;
        }

        if (!this.currentUser || !this.currentUser.id) {
            this._snackbar.error('User not authenticated');
            return;
        }

        this.isAssigningTechnical = true;

        const payload = {
            pic_technical_id: this.selectedTechnical.id,
            assign_technical: true, // Flag untuk indicate assign dari detail page
            user_id: this.currentUser.id // User yang melakukan assignment
        };

        this._ticketService.updateTicket(this.ticket.id, payload)
            .pipe(
                catchError((error) => {
                    console.error('Error assigning technical:', error);
                    this._snackbar.error('Failed to assign technical');
                    return of(null);
                }),
                finalize(() => {
                    this.isAssigningTechnical = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success('Technical assigned successfully');
                    this.showAssignTechnical = false;
                    this.selectedTechnical = null;
                    this.technicalSearchQuery = '';
                    // Reload ticket detail to get updated data
                    this.loadTicketDetail();
                }
            });
    }

    getActionType(text: string): string {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('dibuat') || lowerText.includes('created')) return 'created';
        if (lowerText.includes('assign') || lowerText.includes('dialihkan')) return 'assigned';
        if (lowerText.includes('dimulai') || lowerText.includes('started') || lowerText.includes('proses')) return 'started';
        if (lowerText.includes('diselesaikan') || lowerText.includes('resolved')) return 'resolved';
        if (lowerText.includes('ditutup') || lowerText.includes('closed')) return 'closed';
        if (lowerText.includes('dibuka kembali') || lowerText.includes('reopened')) return 'reopened';
        return 'updated';
    }

    getActionIcon(action: string): string {
        switch (action) {
            case 'created': return 'add_circle';
            case 'assigned': return 'person';
            case 'started': return 'play_circle';
            case 'resolved': return 'check_circle';
            case 'closed': return 'lock';
            case 'reopened': return 'refresh';
            default: return 'edit';
        }
    }

    getActionColor(action: string): string {
        switch (action) {
            case 'created': return 'from-green-400 to-green-500';
            case 'assigned': return 'from-blue-400 to-blue-500';
            case 'started': return 'from-purple-400 to-purple-500';
            case 'resolved': return 'from-teal-400 to-teal-500';
            case 'closed': return 'from-green-400 to-green-500';
            case 'reopened': return 'from-orange-400 to-orange-500';
            default: return 'from-indigo-400 to-indigo-500';
        }
    }

    getAvatarClasses(action: string, isLatest: boolean): string {
        if (isLatest) {
            return 'bg-gradient-to-br from-amber-400 to-amber-500 ring-amber-400 dark:ring-amber-500';
        }
        return `bg-gradient-to-br ${this.getActionColor(action)} ring-gray-300 dark:ring-gray-600`;
    }

    getIconClasses(action: string, isLatest: boolean): string {
        if (isLatest) {
            return 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-md';
        }
        return `bg-gradient-to-br ${this.getActionColor(action)} shadow-sm`;
    }

    cancelAssignTechnical(): void {
        this.showAssignTechnical = false;
        this.selectedTechnical = null;
        this.technicalSearchQuery = '';
        this.technicalDropdownOpen = false;
    }

    // Check if current user is an approver for this approval item
    isCurrentUserApprover(approvalItem: any): boolean {
        if (!this.currentUser || !approvalItem) {
            return false;
        }
        return approvalItem.user_id === this.currentUser.id;
    }

    // Show approval notes in a dialog
    showApprovalNotes(approvalItem: any): void {
        this._dialog.open(ApprovalNotesViewDialogComponent, {
            width: '550px',
            data: {
                approverName: approvalItem.user?.name || 'Unknown',
                status: approvalItem.status,
                notes: approvalItem.notes,
                approvedAt: this.formatDate(approvalItem.approved_at || approvalItem.created_at)
            }
        });
    }

    // Approve ticket
    approveTicket(approvalItemId: string): void {
        const dialogRef = this._dialog.open(ApprovalNotesDialogComponent, {
            width: '550px',
            data: {
                title: 'Approve Ticket',
                message: 'Are you sure you want to approve this ticket?',
                type: 'approve'
            }
        });

        dialogRef.afterClosed().subscribe((notes) => {
            if (notes !== null) {
                this._handleApprovalAction(approvalItemId, 'approved', notes);
            }
        });
    }

    // Decline ticket
    declineTicket(approvalItemId: string): void {
        const dialogRef = this._dialog.open(ApprovalNotesDialogComponent, {
            width: '550px',
            data: {
                title: 'Decline Ticket',
                message: 'Are you sure you want to decline this ticket?',
                type: 'decline'
            }
        });

        dialogRef.afterClosed().subscribe((notes) => {
            if (notes !== null) {
                this._handleApprovalAction(approvalItemId, 'rejected', notes);
            }
        });
    }

    // Handle approval action (approve/decline)
    private _handleApprovalAction(approvalItemId: string, status: string, notes?: string): void {
        const payload: any = {
            status: status,
            user_id: this.currentUser?.id
        };

        if (notes) {
            payload.notes = notes;
        }

        this._httpClient
            .put(`${this.backendApiUrl}/approval-items/${approvalItemId}`, payload)
            .pipe(
                catchError((error) => {
                    console.error('Error updating approval:', error);
                    this._snackbar.error(
                        error?.error?.message || `Failed to ${status === 'approved' ? 'approve' : 'decline'} ticket`
                    );
                    return of(null);
                })
            )
            .subscribe((response: any) => {
                if (response && response.status) {
                    this._snackbar.success(
                        response.message || `Ticket ${status === 'approved' ? 'approved' : 'declined'} successfully`
                    );
                    this.loadTicketDetail();
                }
            });
    }

    // Check if current user can edit approval
    canEditApproval(): boolean {
        if (!this.currentUser || !this.ticket) {
            return false;
        }
        return this.ticket.pic_technical_id === this.currentUser.id;
    }

    // Open edit approval dialog
    editApproval(): void {
        if (!this.ticket.approval || !this.ticket.approval.items) {
            this._snackbar.error('No approval found for this ticket');
            return;
        }

        const dialogRef = this._dialog.open(EditApprovalDialogComponent, {
            width: '600px',
            data: {
                approvalItems: this.ticket.approval.items,
                backendApiUrl: this.backendApiUrl,
                hrisApiUrl: this.hrisApiUrl
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.length > 0) {
                // User clicked Save with approvers
                this.saveApprovers(result);
            }
        });
    }

    // Save approvers (called from dialog result)
    private saveApprovers(approvers: any[]): void {
        if (approvers.length === 0) {
            this._snackbar.error('Please add at least one approver');
            return;
        }

        const payload = {
            approval_required: '1',
            approver_ids: JSON.stringify(
                approvers.map(a => ({
                    user_id: a.id,
                    level: a.level
                }))
            ),
            user_id: this.currentUser?.id
        };

        this._ticketService
            .updateTicket(this.ticket.id, payload)
            .pipe(
                catchError((error) => {
                    console.error('Error updating approvers:', error);
                    this._snackbar.error(
                        error?.error?.message || 'Failed to update approvers'
                    );
                    return of(null);
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success('Approvers updated successfully');
                    this.loadTicketDetail();
                }
            });
    }

    getAvatarColor(name: string): string {
        const index = name?.charCodeAt(0) % this.avatarColors.length || 0;
        return this.avatarColors[index];
    }
}
