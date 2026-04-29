import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AccessRequestService } from '../access-request.service';
import { catchError, finalize, of } from 'rxjs';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { ConfirmationDialogService } from 'app/core/services/confirmation-dialog.service';
import { SafePipe } from 'app/shared/pipes/safe.pipe';
import { UserService } from 'app/core/user/user.service';
import { TranslocoService } from '@jsverse/transloco';

interface Comment {
    id: string;
    author: string;
    user?: any;
    text: string;
    at: string;
    isInternal?: boolean;
    attachments?: { id: string; name: string; size: string; mime: string; path: string }[];
    replies?: Comment[];
}

@Component({
    selector: 'app-access-request-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        MatTooltipModule,
        SafePipe
    ],
    templateUrl: './detail.component.html',
})
export class AccessRequestDetailComponent implements OnInit, AfterViewInit {
    @ViewChild('commentList') commentListElement?: ElementRef;

    id = '';
    accessRequest: any = null;
    isLoading = false;
    createdByUser: string = '';
    createdAt: string = '';
    currentUser: any = null;

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

    // Refresh state
    isRefreshing = false;

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
        private _accessRequestService: AccessRequestService,
        private _snackbar: SnackbarService,
        private _userService: UserService,
        private _httpClient: HttpClient,
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
    }

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('id') ?? '';

        // Get current user
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
        });

        if (this.id) {
            this.loadAccessRequestDetail();
        }
    }

    loadAccessRequestDetail(): void {
        this.isLoading = true;

        this._accessRequestService.getAccessRequest(this.id)
            .pipe(
                catchError((error) => {
                    console.error('Error loading access request:', error);
                    this._snackbar.error('Failed to load access request details');
                    this.router.navigate(['/access-requests/data']);
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    this.accessRequest = response.data;

                    // Load comments
                    if (this.accessRequest.comments && Array.isArray(this.accessRequest.comments)) {
                        this.comments = this.accessRequest.comments.map((c: any) => ({
                            id: c.id,
                            author: c.user?.name || 'Unknown',
                            user: c.user,
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
                            replies: c.replies?.map((r: any) => ({
                                id: r.id,
                                author: r.user?.name || 'Unknown',
                                user: r.user,
                                text: r.comment,
                                at: this.formatDate(r.created_at),
                                attachments: r.attachments?.map((a: any) => ({
                                    id: a.id,
                                    name: a.name,
                                    size: this.formatFileSize(a.size),
                                    mime: a.mime,
                                    path: a.path
                                })) || [],
                                replies: []
                            })) || []
                        }));
                    }

                    // Get creator info from tracks
                    if (this.accessRequest.tracks && Array.isArray(this.accessRequest.tracks)) {
                        const createdTrack = this.accessRequest.tracks.find((track: any) => track.action === 'created');
                        if (createdTrack) {
                            this.createdByUser = createdTrack.user?.name || 'Unknown';
                            this.createdAt = createdTrack.created_at;
                        } else {
                            this.createdByUser = this.accessRequest.full_name || 'Unknown';
                            this.createdAt = this.accessRequest.created_at;
                        }
                    } else {
                        this.createdByUser = this.accessRequest.full_name || 'Unknown';
                        this.createdAt = this.accessRequest.created_at;
                    }

                    // Map tracks to activity log
                    if (this.accessRequest.tracks && Array.isArray(this.accessRequest.tracks)) {
                        this.activity = this.accessRequest.tracks.map((track: any) => {
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
                        this.activity = [
                            {
                                text: 'Access Request created',
                                at: this.formatDate(this.accessRequest.created_at),
                                action: 'created',
                                user: null
                            }
                        ];
                    }
                }
            });
    }

    refreshAccessRequestData(): void {
        if (this.isRefreshing) {
            return;
        }

        this.isRefreshing = true;

        this._accessRequestService.getAccessRequest(this.id)
            .pipe(
                catchError((error) => {
                    console.error('Error refreshing access request:', error);
                    this._snackbar.error('Failed to refresh access request data');
                    return of(null);
                }),
                finalize(() => {
                    this.isRefreshing = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    this.accessRequest = response.data;
                    this._snackbar.success('Access request data refreshed successfully');

                    // Update comments if needed
                    if (this.accessRequest.comments && Array.isArray(this.accessRequest.comments)) {
                        this.comments = this.accessRequest.comments.map((c: any) => ({
                            id: c.id,
                            author: c.user?.name || 'Unknown',
                            user: c.user,
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
                            replies: c.replies?.map((r: any) => ({
                                id: r.id,
                                author: r.user?.name || 'Unknown',
                                user: r.user,
                                text: r.comment,
                                at: this.formatDate(r.created_at),
                                attachments: r.attachments?.map((a: any) => ({
                                    id: a.id,
                                    name: a.name,
                                    size: this.formatFileSize(a.size),
                                    mime: a.mime,
                                    path: a.path
                                })) || []
                            })) || []
                        }));
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

    getPriorityLabel(priority: number | null): string {
        if (priority === null || priority === undefined) {
            return this._translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_LOW');
        }
        const labels = [
            this._translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_LOW'),
            this._translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_MEDIUM'),
            this._translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_HIGH'),
            this._translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_CRITICAL')
        ];
        return labels[priority] || this._translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_MEDIUM');
    }

    getStatusLabel(status: number): string {
        const labels = ['Pending', 'Approved', 'Rejected', 'Provisioned'];
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

    getAvatarColor(name: string): string {
        const colors = [
            'bg-indigo-400', 'bg-orange-400', 'bg-teal-400', 'bg-purple-400',
            'bg-blue-400', 'bg-pink-400', 'bg-green-400', 'bg-red-400',
            'bg-cyan-400', 'bg-amber-400', 'bg-lime-500', 'bg-rose-400',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    getAttachmentPreviewUrlById(attachmentId: string): string {
        return `${this.backendApiUrl}/attachments/${attachmentId}/view`;
    }

    getAttachmentDownloadUrl(attachmentId: string): string {
        return `${this.backendApiUrl}/attachments/${attachmentId}/download`;
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    }

    // Preview modal methods
    openPreview(attachment: any): void {
        this.previewAttachment = attachment;
        this.showPreviewModal = true;
        this.previewZoom = 1;
        this.previewRotation = 0;
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
        if (!this.replyText.trim() || !this.accessRequest) return;

        if (!this.currentUser || !this.currentUser.id) {
            this._snackbar.error('User not authenticated');
            return;
        }

        this.isSubmittingReply = true;

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('commentable_type', 'AccessRequest');
        formData.append('commentable_id', this.accessRequest.id);
        formData.append('user_id', this.currentUser.id);
        formData.append('comment', this.replyText.trim());
        formData.append('is_internal', '0');
        formData.append('parent_id', comment.id);

        // Append files if any
        if (this.replyFiles.length > 0) {
            this.replyFiles.forEach((file) => {
                formData.append('attachments[]', file, file.name);
            });
        }

        this._httpClient.post<any>(`${this.backendApiUrl}/comments`, formData)
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
                    const newReply: Comment = {
                        id: response.data.id,
                        author: response.data.user?.name || 'You',
                        user: response.data.user,
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

                    this.replyingToId = null;
                    this.replyText = '';
                    this.replyFiles = [];

                    this._snackbar.success('Reply added successfully');
                }
            });
    }

    onReplyFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.replyFiles.push(...Array.from(input.files));
        }
    }

    removeReplyFile(index: number): void {
        this.replyFiles.splice(index, 1);
    }

    addComment(): void {
        if (!this.newCommentText.trim() || !this.accessRequest) return;

        if (!this.currentUser || !this.currentUser.id) {
            this._snackbar.error('User not authenticated');
            return;
        }

        this.isSubmittingComment = true;

        const formData = new FormData();
        formData.append('commentable_type', 'AccessRequest');
        formData.append('commentable_id', this.accessRequest.id);
        formData.append('user_id', this.currentUser.id);
        formData.append('comment', this.newCommentText.trim());
        formData.append('is_internal', this.newCommentInternal ? '1' : '0');

        if (this.newCommentFiles.length > 0) {
            this.newCommentFiles.forEach((file) => {
                formData.append('attachments[]', file, file.name);
            });
        }

        this._httpClient.post<any>(`${this.backendApiUrl}/comments`, formData)
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
                    const newComment: Comment = {
                        id: response.data.id,
                        author: response.data.user?.name || 'You',
                        user: response.data.user,
                        text: response.data.comment,
                        at: 'Just now',
                        isInternal: this.newCommentInternal,
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

                    this.newCommentText = '';
                    this.newCommentInternal = false;
                    this.newCommentFiles = [];

                    this._snackbar.success('Comment added successfully');
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

    scrollToBottom(): void {
        if (!this.commentListElement) return;

        const element = this.commentListElement.nativeElement;
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    }

    isCurrentUserApprover(item: any): boolean {
        if (!this.currentUser || !item.user) {
            return false;
        }
        return this.currentUser.id === item.user.id;
    }

    showApprovalNotes(item: any): void {
        // TODO: Implement approval notes dialog
        this._snackbar.info(`Notes: ${item.notes}`);
    }

    approveRequest(itemId: string): void {
        // TODO: Implement approval logic
        this._snackbar.info('Approve functionality to be implemented');
    }

    declineRequest(itemId: string): void {
        // TODO: Implement decline logic
        this._snackbar.info('Decline functionality to be implemented');
    }

    canSeeActions(): boolean {
        // TODO: Implement permission logic
        return true;
    }

    startProcess(): void {
        // TODO: Implement start process logic
        this._snackbar.info('Start process functionality to be implemented');
    }

    approveAccessRequest(): void {
        // TODO: Implement approve logic
        this._snackbar.info('Approve functionality to be implemented');
    }

    rejectAccessRequest(): void {
        // TODO: Implement reject logic
        this._snackbar.info('Reject functionality to be implemented');
    }

    provisionAccess(): void {
        // TODO: Implement provision logic
        this._snackbar.info('Provision functionality to be implemented');
    }

    canEditAccessRequest(): boolean {
        if (!this.currentUser || !this.accessRequest) {
            return false;
        }

        // Only show edit button if status is Pending (0)
        if (this.accessRequest.status !== 0) {
            return false;
        }

        // Check if user role is Agent or Admin
        const isAgent = this.currentUser.role_name?.toLowerCase() === 'agent';
        const isAdmin = this.currentUser.role_name?.toLowerCase() === 'admin';

        // Show edit button if user is Agent or Admin
        return isAgent || isAdmin;
    }

    editAccessRequest(): void {
        if (this.accessRequest?.id) {
            this.router.navigate(['/access-requests/edit', this.accessRequest.id]);
        }
    }

    getTotalCommentCount(): number {
        let total = this.comments.length;
        this.comments.forEach(c => {
            if (c.replies && c.replies.length > 0) {
                total += c.replies.length;
            }
        });
        return total;
    }

    onCommentScroll(): void {
        if (!this.commentListElement) return;
        
        const element = this.commentListElement.nativeElement;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        
        this.showScrollToBottom = (scrollHeight - scrollTop - clientHeight) > 100;
    }

    ngAfterViewInit(): void {
        if (this.commentListElement) {
            const element = this.commentListElement.nativeElement;
            element.addEventListener('scroll', () => {
                this.onCommentScroll();
            });
        }
    }

    getIconClasses(action: string, isLatest: boolean): string {
        const baseClasses = 'flex h-6 w-6 items-center justify-center rounded-full';
        
        if (isLatest) {
            return `${baseClasses} bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900`;
        }
        
        switch (action) {
            case 'created':
                return `${baseClasses} bg-blue-500`;
            case 'approved':
                return `${baseClasses} bg-green-500`;
            case 'rejected':
                return `${baseClasses} bg-red-500`;
            case 'provisioned':
                return `${baseClasses} bg-purple-500`;
            default:
                return `${baseClasses} bg-gray-400`;
        }
    }

    getActionIcon(action: string): string {
        switch (action) {
            case 'created':
                return 'add_circle';
            case 'approved':
                return 'check_circle';
            case 'rejected':
                return 'cancel';
            case 'provisioned':
                return 'vpn_key';
            case 'updated':
                return 'edit';
            default:
                return 'circle';
        }
    }
}
