import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';

type TaskType = 'Ticket' | 'Access Request' | 'Job Request' | 'Change Request';
type TaskStatus = 'Pending' | 'In Progress' | 'Waiting Approval' | 'Done';

interface UserTask {
    id: string;
    type: TaskType;
    code: string;
    title: string;
    assignedToEmail: string;
    assignedToName: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: TaskStatus;
    updatedAt: string;
}

@Component({
    selector: 'app-task',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './task.component.html',
})
export class TaskComponent implements OnInit {
    currentUser: User | null = null;
    tasks: UserTask[] = [];

    private readonly _dummyTasks: UserTask[] = [
        {
            id: '1',
            type: 'Ticket',
            code: 'TKT-2026-0101',
            title: 'Cannot access SAP production',
            assignedToEmail: 'agent@example.com',
            assignedToName: 'Agent User',
            priority: 'Critical',
            status: 'In Progress',
            updatedAt: '10 minutes ago',
        },
        {
            id: '2',
            type: 'Access Request',
            code: 'AR-2026-0034',
            title: 'Grant read/write access to finance app',
            assignedToEmail: 'agent@example.com',
            assignedToName: 'Agent User',
            priority: 'High',
            status: 'Waiting Approval',
            updatedAt: '25 minutes ago',
        },
        {
            id: '3',
            type: 'Job Request',
            code: 'JR-2026-0012',
            title: 'Backend Engineer hiring request',
            assignedToEmail: 'agent@example.com',
            assignedToName: 'Agent User',
            priority: 'Medium',
            status: 'Pending',
            updatedAt: '1 hour ago',
        },
        {
            id: '4',
            type: 'Change Request',
            code: 'CR-2026-0047',
            title: 'Deploy payment service patch',
            assignedToEmail: 'agent@example.com',
            assignedToName: 'Agent User',
            priority: 'High',
            status: 'In Progress',
            updatedAt: '2 hours ago',
        },
        {
            id: '5',
            type: 'Ticket',
            code: 'TKT-2026-0109',
            title: 'VPN access issue',
            assignedToEmail: 'other.user@example.com',
            assignedToName: 'Other User',
            priority: 'Low',
            status: 'Pending',
            updatedAt: '3 hours ago',
        },
    ];

    constructor(private _userService: UserService) {}

    ngOnInit(): void {
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
            this.tasks = this._dummyTasks.filter(
                (task) =>
                    task.assignedToEmail.toLowerCase() ===
                        (user.email || '').toLowerCase() ||
                    task.assignedToName.toLowerCase() ===
                        (user.name || '').toLowerCase()
            );
        });
    }

    countByType(type: TaskType): number {
        return this.tasks.filter((task) => task.type === type).length;
    }

    getPriorityClass(priority: UserTask['priority']): string {
        if (priority === 'Critical') return 'bg-red-100 text-red-700';
        if (priority === 'High') return 'bg-orange-100 text-orange-700';
        if (priority === 'Medium') return 'bg-yellow-100 text-yellow-700';
        return 'bg-slate-100 text-slate-700';
    }

    getStatusClass(status: TaskStatus): string {
        if (status === 'Done') return 'bg-emerald-100 text-emerald-700';
        if (status === 'In Progress') return 'bg-blue-100 text-blue-700';
        if (status === 'Waiting Approval') return 'bg-purple-100 text-purple-700';
        return 'bg-gray-100 text-gray-700';
    }
}
