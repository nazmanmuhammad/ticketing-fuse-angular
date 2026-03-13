import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface JobRequestDetail {
    id: string;
    code: string;
    title: string;
    description: string;
    department: string;
    location: string;
    employmentType: 'Full-time' | 'Contract' | 'Internship';
    level: 'Junior' | 'Mid' | 'Senior';
    headcount: number;
    budget: string;
    neededBy: string;
    requesterName: string;
    requesterEmail: string;
    hiringManager: string;
    assignType: 'member' | 'team';
    assignTo: string;
    createdAgo: string;
    status: 'Pending approval' | 'Open' | 'Approved' | 'Rejected';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    createdAt: string;
    attachments: Attachment[];
    approvals: ApprovalStep[];
    comments: Comment[];
    activity: { text: string; at: string }[];
}

@Component({
    selector: 'app-job-request-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './detail.component.html',
})
export class JobRequestDetailComponent {
    id = '';
    detail: JobRequestDetail | null = null;
    internalNote = false;
    newComment = '';

    replyingToId: string | null = null;
    replyText = '';

    pendingFiles: { name: string; size: string }[] = [];

    constructor(private route: ActivatedRoute) {
        const idParam = this.route.snapshot.paramMap.get('id') ?? '1';
        this.id = idParam;
        this.detail = this.generateDummy(idParam);
    }

    private toCode(id: string): string {
        if (id.toUpperCase().startsWith('JR-')) return id.toUpperCase();
        const n = Number.parseInt(id, 10);
        const suffix = Number.isFinite(n) ? String(n).padStart(4, '0') : '0001';
        return `JR-2026-${suffix}`;
    }

    generateDummy(id: string): JobRequestDetail {
        const code = this.toCode(id);
        const variants: Array<Pick<JobRequestDetail, 'title' | 'department' | 'location' | 'level' | 'priority'>> =
            [
                {
                    title: 'Senior Frontend Developer',
                    department: 'Engineering',
                    location: 'Jakarta',
                    level: 'Senior',
                    priority: 'High',
                },
                {
                    title: 'Product Manager',
                    department: 'Product',
                    location: 'Bandung',
                    level: 'Mid',
                    priority: 'Medium',
                },
                {
                    title: 'UX Designer',
                    department: 'Design',
                    location: 'Remote',
                    level: 'Mid',
                    priority: 'Low',
                },
            ];

        const idx = Math.max(0, (Number.parseInt(id, 10) || 1) - 1) % variants.length;
        const v = variants[idx];

        return {
            id,
            code,
            title: v.title,
            description:
                'We need additional headcount to support ongoing initiatives. This requisition covers role scope, expected responsibilities, and hiring timeline.',
            department: v.department,
            location: v.location,
            employmentType: 'Full-time',
            level: v.level,
            headcount: 1,
            budget: 'IDR 25,000,000 / month',
            neededBy: 'Mar 31, 2026',
            requesterName: 'John Doe',
            requesterEmail: 'john.doe@example.com',
            hiringManager: 'Jane Smith',
            assignType: 'team',
            assignTo: 'HR Recruitment',
            createdAgo: '3 hours ago',
            status: 'Pending approval',
            priority: v.priority,
            createdAt: 'Mar 10, 2026 09:15',
            attachments: [
                {
                    id: 'jd1',
                    name: 'job_description.pdf',
                    size: '312 KB',
                },
            ],
            approvals: [
                {
                    level: 1,
                    approver: 'Hiring Manager',
                    status: 'Approved',
                    updatedAt: '2 hours ago',
                    note: 'Role scope is aligned with team needs.',
                },
                {
                    level: 2,
                    approver: 'Department Head',
                    status: 'Pending',
                    updatedAt: '—',
                },
                {
                    level: 3,
                    approver: 'HR',
                    status: 'Pending',
                    updatedAt: '—',
                },
            ],
            comments: [
                {
                    id: 'c1',
                    author: 'HR Recruitment',
                    text: 'Please confirm if this role should be opened as backfill or new headcount.',
                    at: '1 hour ago',
                    isInternal: true,
                    attachments: [],
                    replies: [],
                },
            ],
            activity: [
                { text: 'Job Request created', at: '3 hours ago' },
                { text: 'Approval L1 approved by Hiring Manager', at: '2 hours ago' },
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

