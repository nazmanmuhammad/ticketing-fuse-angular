import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface Attachment {
    id: string;
    name: string;
    size: string;
}

interface ApprovalStep {
    level: number;
    approver: string;
    status: 'Approved' | 'Pending' | 'Rejected';
    updatedAt: string;
    note?: string;
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

interface ChangeRequestDetail {
    id: string;
    code: string;
    subject: string;
    description: string;
    fullName: string;
    email: string;
    phone?: string;
    extension?: string;
    application: string;
    impact: 'Low' | 'Medium' | 'High';
    risk: 'Low' | 'Medium' | 'High';
    assignType: 'member' | 'team';
    assignTo: string;
    createdAgo: string;
    status: 'Pending approval' | 'Open' | 'In progress' | 'Resolved';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    createdAt: string;
    attachments: Attachment[];
    approvals: ApprovalStep[];
    slaPlan: string;
    comments: Comment[];
    activity: { text: string; at: string }[];
}

@Component({
    selector: 'app-change-request-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatMenuModule],
    templateUrl: './detail.component.html',
})
export class ChangeRequestDetailComponent {
    id = '';
    detail: ChangeRequestDetail | null = null;
    internalNote = false;
    newComment = '';

    // Reply state
    replyingToId: string | null = null;
    replyText = '';

    // Attach state (simulated)
    pendingFiles: { name: string; size: string }[] = [];

    constructor(private route: ActivatedRoute) {
        const idParam =
            this.route.snapshot.paramMap.get('id') ?? 'CR-2026-0001';
        this.id = idParam;
        this.detail = this.generateDummy(idParam);
    }

    generateDummy(id: string): ChangeRequestDetail {
        return {
            id,
            code: id,
            subject: 'Upgrade Server Database Production',
            description:
                'Perlu dilakukan upgrade versi database server production untuk meningkatkan performa dan keamanan. Downtime diperkirakan selama 2 jam pada weekend.',
            fullName: 'DevOps Lead',
            email: 'devops@example.com',
            phone: '+62 812 9876 5432',
            extension: '456',
            application: 'Core Database',
            impact: 'High',
            risk: 'Medium',
            assignType: 'team',
            assignTo: 'Infrastructure',
            createdAgo: '2 hours ago',
            status: 'Pending approval',
            priority: 'High',
            createdAt: 'Mar 05, 2026 09:00',
            attachments: [
                {
                    id: 'doc1',
                    name: 'migration_plan.pdf',
                    size: '2.4 MB',
                },
            ],
            approvals: [
                {
                    level: 1,
                    approver: 'IT Manager',
                    status: 'Approved',
                    updatedAt: '1 hour ago',
                    note: 'Plan looks good. Proceed with caution.',
                },
                {
                    level: 2,
                    approver: 'CTO',
                    status: 'Pending',
                    updatedAt: '—',
                },
            ],
            slaPlan: '24 Hours',
            comments: [
                {
                    id: 'c1',
                    author: 'IT Manager',
                    text: 'Pastikan backup sudah dilakukan sebelum eksekusi.',
                    at: '1 hour ago',
                    isInternal: false,
                    attachments: [],
                    replies: [
                        {
                            id: 'c1r1',
                            author: 'DevOps Lead',
                            text: 'Siap pak, backup full akan dijalankan H-1.',
                            at: '55 minutes ago',
                            replies: [],
                        },
                    ],
                },
            ],
            activity: [
                { text: 'Change Request created by DevOps Lead', at: '2 hours ago' },
                {
                    text: 'Approval L1 approved by IT Manager',
                    at: '1 hour ago',
                },
            ],
        };
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
        if (!this.newComment.trim() || !this.detail) return;
        this.detail.comments.unshift({
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
        if (!this.detail) return 0;
        const total = this.detail.approvals.length;
        const done = this.detail.approvals.filter(
            (a) => a.status === 'Approved'
        ).length;
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }

    approvedCount(): number {
        if (!this.detail) return 0;
        return this.detail.approvals.filter((a) => a.status === 'Approved')
            .length;
    }

    approvalsTotal(): number {
        if (!this.detail) return 0;
        return this.detail.approvals.length;
    }
}
