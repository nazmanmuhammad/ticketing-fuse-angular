import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketService } from '../ticket.service';
import { catchError, finalize, of } from 'rxjs';
import { SnackbarService } from 'app/core/services/snackbar.service';

interface Attachment {
    id: string;
    name: string;
    size: string;
}

interface Comment {
    id: string;
    author: string;
    text: string;
    at: string;
    isInternal?: boolean;
    attachments?: { name: string; size: string }[];
    replies?: Comment[];
}

@Component({
    selector: 'app-ticket-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatMenuModule],
    templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit {
    id = '';
    ticket: any = null;
    isLoading = false;
    internalNote = false;
    newComment = '';
    createdByUser: string = '';
    createdAt: string = '';

    // Reply state
    replyingToId: string | null = null;
    replyText = '';

    // Attach state (simulated)
    pendingFiles: { name: string; size: string }[] = [];
    comments: Comment[] = [];
    activity: { text: string; at: string }[] = [];

    private readonly _hrisApiUrl: string =
        (globalThis as any)?.__env?.HRIS_API_URL ||
        (globalThis as any)?.process?.env?.HRIS_API_URL ||
        (globalThis as any)?.HRIS_API_URL ||
        'https://back.siglab.co.id';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private _ticketService: TicketService,
        private _snackbar: SnackbarService
    ) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('id') ?? '';
        console.log('Detail Component - Ticket ID:', this.id);
        if (this.id) {
            this.loadTicketDetail();
        }
    }

    loadTicketDetail(): void {
        console.log('Loading ticket detail for ID:', this.id);
        this.isLoading = true;
        this._ticketService.getTicket(this.id)
            .pipe(
                catchError((error) => {
                    console.error('Error loading ticket:', error);
                    this._snackbar.error('Failed to load ticket details');
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
                    
                    // Initialize comments (can be extended later)
                    this.comments = [];
                    
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
                            let text = track.description;
                            
                            // Add user name if available
                            if (track.user && track.user.name) {
                                // Customize text based on action
                                switch (track.action) {
                                    case 'created':
                                        text = `Ticket created by ${track.user.name}`;
                                        break;
                                    case 'assigned':
                                        text = `Ticket assigned by ${track.user.name}`;
                                        break;
                                    case 'status_changed':
                                        text = `Status changed by ${track.user.name}`;
                                        break;
                                    case 'updated':
                                        text = `Ticket updated by ${track.user.name}`;
                                        break;
                                    default:
                                        text = `${track.description} by ${track.user.name}`;
                                }
                            }
                            
                            return {
                                text: text,
                                at: this.formatDate(track.created_at)
                            };
                        });
                    } else {
                        // Fallback if no ticket_track data
                        this.activity = [
                            { 
                                text: 'Ticket created', 
                                at: this.formatDate(this.ticket.created_at) 
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

    startReply(commentId: string): void {
        this.replyingToId = this.replyingToId === commentId ? null : commentId;
        this.replyText = '';
    }

    cancelReply(): void {
        this.replyingToId = null;
        this.replyText = '';
    }

    submitReply(comment: Comment): void {
        if (!this.replyText.trim()) return;
        if (!comment.replies) comment.replies = [];
        comment.replies.push({
            id: 'r_' + Date.now(),
            author: 'You',
            text: this.replyText.trim(),
            at: 'Just now',
            replies: [],
        });
        this.replyingToId = null;
        this.replyText = '';
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
        if (!this.newComment.trim() || !this.ticket) return;
        this.comments.unshift({
            id: 'c_' + Date.now(),
            author: 'You',
            text: this.newComment.trim(),
            at: 'Just now',
            isInternal: this.internalNote,
            attachments: [...this.pendingFiles],
            replies: [],
        });
        this.newComment = '';
        this.internalNote = false;
        this.pendingFiles = [];
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
}
