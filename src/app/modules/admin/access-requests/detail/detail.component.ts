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

interface AccessRequestDetail {
    id: string;
    code: string;
    subject: string; // usually "Access Request for [System]"
    description: string; // Justification
    fullName: string;
    email: string;
    department: string;
    system: string;
    environment: 'Development' | 'Staging' | 'Production';
    accessType: 'Read Only' | 'Read/Write' | 'Admin';
    role: string;
    duration: 'Permanent' | 'Temporary';
    startDate?: string;
    endDate?: string;
    assignType: 'member' | 'team';
    assignTo: string;
    createdAgo: string;
    status: 'Pending approval' | 'Approved' | 'Rejected' | 'Provisioned';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    createdAt: string;
    attachments: Attachment[];
    approvals: ApprovalStep[];
    slaPlan: string;
    comments: Comment[];
    activity: { text: string; at: string }[];
}

@Component({
    selector: 'app-access-request-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatMenuModule],
    templateUrl: './detail.component.html',
})
export class AccessRequestDetailComponent {
    id = '';
    detail: AccessRequestDetail | null = null;
    internalNote = false;
    newComment = '';

    // Reply state
    replyingToId: string | null = null;
    replyText = '';

    // Attach state (simulated)
    pendingFiles: { name: string; size: string }[] = [];

    constructor(private route: ActivatedRoute) {
        const idParam =
            this.route.snapshot.paramMap.get('id') ?? 'AR-2026-0001';
        this.id = idParam;
        this.detail = this.generateDummy(idParam);
    }

    generateDummy(id: string): AccessRequestDetail {
        return {
            id,
            code: id,
            subject: 'Access Request for SAP Production',
            description:
                'Requesting write access to SAP Production environment for end-of-month financial reporting tasks. Need to update ledger entries.',
            fullName: 'Finance Staff',
            email: 'finance@example.com',
            department: 'Finance',
            system: 'SAP ERP',
            environment: 'Production',
            accessType: 'Read/Write',
            role: 'Financial Controller',
            duration: 'Permanent',
            assignType: 'team',
            assignTo: 'Security Admin',
            createdAgo: '4 hours ago',
            status: 'Pending approval',
            priority: 'Medium',
            createdAt: 'Mar 05, 2026 07:00',
            attachments: [],
            approvals: [
                {
                    level: 1,
                    approver: 'Finance Manager',
                    status: 'Approved',
                    updatedAt: '3 hours ago',
                    note: 'Approved for month-end closing.',
                },
                {
                    level: 2,
                    approver: 'Security Admin',
                    status: 'Pending',
                    updatedAt: '—',
                },
            ],
            slaPlan: '48 Hours',
            comments: [
                {
                    id: 'c1',
                    author: 'Security Admin',
                    text: 'Please confirm if this role requires segregation of duties check.',
                    at: '2 hours ago',
                    isInternal: true,
                    attachments: [],
                    replies: [],
                },
            ],
            activity: [
                { text: 'Access Request created by Finance Staff', at: '4 hours ago' },
                {
                    text: 'Approval L1 approved by Finance Manager',
                    at: '3 hours ago',
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
