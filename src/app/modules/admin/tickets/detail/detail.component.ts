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

interface SLAInfo {
    status: 'On track' | 'Breached' | 'Due soon';
    due: string;
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

interface TicketDetail {
    id: string;
    code: string;
    subject: string;
    description: string;
    fullName: string;
    email: string;
    phone?: string;
    extension?: string;
    ticketSource: string;
    department?: string;
    helpTopic?: string;
    role: 'External' | 'Internal';
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
    selector: 'app-ticket-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatMenuModule],
    templateUrl: './detail.component.html',
})
export class DetailComponent {
    id = '';
    detail: TicketDetail | null = null;
    internalNote = false;
    newComment = '';

    // Reply state
    replyingToId: string | null = null;
    replyText = '';

    // Attach state (simulated)
    pendingFiles: { name: string; size: string }[] = [];

    constructor(private route: ActivatedRoute) {
        const idParam =
            this.route.snapshot.paramMap.get('id') ?? 'TKT-2026-0001';
        this.id = idParam;
        this.detail = this.generateDummy(idParam);
    }

    generateDummy(id: string): TicketDetail {
        return {
            id,
            code: id,
            subject: 'Kendala tidak bisa login ke SAP',
            description:
                'User melaporkan tidak dapat melakukan login ke sistem SAP sejak pagi hari. Sudah dicoba beberapa kali namun tetap muncul error "Invalid credentials". Password sudah dipastikan benar dan tidak ada perubahan sejak terakhir login berhasil.',
            fullName: 'Agent User',
            email: 'agent@example.com',
            phone: '+62 812 3456 7890',
            extension: '123',
            ticketSource: 'Email',
            department: 'IT Support',
            helpTopic: 'Application',
            role: 'External',
            assignType: 'member',
            assignTo: 'Agent User',
            createdAgo: '22 minutes ago',
            status: 'Pending approval',
            priority: 'Critical',
            createdAt: 'Mar 03, 2026 06:42',
            attachments: [
                {
                    id: '2e183df3-3dd7-46ad-8caf-724319243a89',
                    name: 'screenshot.png',
                    size: '1.2 MB',
                },
            ],
            approvals: [
                {
                    level: 1,
                    approver: 'Super Admin',
                    status: 'Approved',
                    updatedAt: '21 minutes ago',
                    note: 'Sudah diverifikasi, silakan lanjutkan ke level berikutnya.',
                },
                {
                    level: 2,
                    approver: 'Manager User',
                    status: 'Pending',
                    updatedAt: '—',
                },
            ],
            slaPlan: 'Default',
            comments: [
                {
                    id: 'c1',
                    author: 'Agent User',
                    text: "[Info Response] Replying to Super Admin's request: baik pak saya lengkapi data nya melalui kolom comment ya",
                    at: '21 minutes ago',
                    isInternal: false,
                    attachments: [],
                    replies: [
                        {
                            id: 'c1r1',
                            author: 'Super Admin',
                            text: 'Oke, silakan dilengkapi. Terima kasih.',
                            at: '20 minutes ago',
                            replies: [],
                        },
                    ],
                },
            ],
            activity: [
                { text: 'Ticket created by Agent User', at: '22 minutes ago' },
                {
                    text: 'Approval L1 approved by Super Admin',
                    at: '21 minutes ago',
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
