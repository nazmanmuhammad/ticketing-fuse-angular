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

    // Reply state
    replyingToId: string | null = null;
    replyText = '';

    // Attach state (simulated)
    pendingFiles: { name: string; size: string }[] = [];
    comments: Comment[] = [];
    activity: { text: string; at: string }[] = [];

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
                    // Initialize comments and activity (can be extended later)
                    this.comments = [];
                    this.activity = [
                        { 
                            text: `Ticket created by ${this.ticket.name}`, 
                            at: this.formatDate(this.ticket.created_at) 
                        }
                    ];
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
