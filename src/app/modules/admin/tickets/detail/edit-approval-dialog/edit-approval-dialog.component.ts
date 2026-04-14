import { Component, Inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface EditApprovalDialogData {
    approvalItems: any[];
    backendApiUrl: string;
    hrisApiUrl: string;
}

@Component({
    selector: 'app-edit-approval-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        FormsModule
    ],
    template: `
        <div class="flex flex-col">
            <h2 mat-dialog-title class="border-b border-gray-200 !m-0 px-6 py-5 text-xl font-bold text-gray-800">Edit Approvals</h2>
            
            <mat-dialog-content class="!m-0 !p-6 overflow-visible">
                <!-- Select Approvers Dropdown -->
                <div class="mb-4">
                    <label class="mb-2 block text-sm font-medium text-gray-700">Select Approvers <span class="text-red-500">*</span></label>
                    <div class="relative">
                        <!-- Dropdown Button -->
                        <button
                            type="button"
                            (click)="toggleDropdown()"
                            class="flex w-full items-center justify-between rounded-lg border-2 border-amber-400 bg-white px-4 py-2.5 text-left text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <div class="flex items-center gap-2">
                                <mat-icon class="icon-size-5 text-amber-500">person_add</mat-icon>
                                <span class="text-gray-500">Select approvers...</span>
                            </div>
                            <mat-icon class="icon-size-5 text-gray-400">
                                {{ dropdownOpen ? 'expand_less' : 'expand_more' }}
                            </mat-icon>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div
                            *ngIf="dropdownOpen"
                            class="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-xl"
                            style="max-height: 400px;"
                        >
                            <!-- Search Input -->
                            <div class="border-b border-gray-200 p-3">
                                <div class="relative">
                                    <mat-icon class="icon-size-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</mat-icon>
                                    <input
                                        type="text"
                                        [(ngModel)]="searchQuery"
                                        (input)="searchApprovers()"
                                        (click)="$event.stopPropagation()"
                                        placeholder="Search approvers..."
                                        class="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                            </div>
                            
                            <!-- User List -->
                            <div class="max-h-80 overflow-auto">
                                <div
                                    *ngFor="let user of filteredUsers"
                                    (click)="selectApprover(user)"
                                    class="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition hover:bg-gray-50"
                                >
                                    <div class="relative h-8 w-8 flex-shrink-0">
                                        <img
                                            *ngIf="user.photo"
                                            [src]="getAvatarUrl(user.photo)"
                                            [alt]="user.name"
                                            class="h-full w-full rounded-full object-cover"
                                        />
                                        <div
                                            *ngIf="!user.photo"
                                            class="flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-white"
                                            [ngClass]="getAvatarColor(user.name)"
                                        >
                                            {{ user.name?.charAt(0) || '?' }}
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
                                        <p class="text-xs text-gray-500">{{ user.department_id }}</p>
                                    </div>
                                </div>
                                <div *ngIf="filteredUsers.length === 0" class="px-4 py-8 text-center text-sm text-gray-500">
                                    No users found
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Selected Approvers -->
                <div *ngIf="editApprovers.length > 0" class="space-y-2">
                    <div *ngFor="let approver of editApprovers; let i = index" 
                        class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <div class="relative h-8 w-8 flex-shrink-0">
                            <img
                                *ngIf="approver.photo"
                                [src]="getAvatarUrl(approver.photo)"
                                [alt]="approver.name"
                                class="h-full w-full rounded-full object-cover"
                            />
                            <div
                                *ngIf="!approver.photo"
                                class="flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-white"
                                [ngClass]="getAvatarColor(approver.name)"
                            >
                                {{ approver.name?.charAt(0) || '?' }}
                            </div>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-900">{{ approver.name }}</p>
                        </div>
                        <select 
                            [value]="approver.level || 1"
                            (change)="updateApproverLevel(i, +$any($event.target).value)"
                            class="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="1">Level 1</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                            <option value="4">Level 4</option>
                            <option value="5">Level 5</option>
                        </select>
                        <button
                            type="button"
                            (click)="removeApprover(i)"
                            class="text-red-500 transition hover:text-red-700"
                        >
                            <mat-icon class="icon-size-5">close</mat-icon>
                        </button>
                    </div>
                </div>
            </mat-dialog-content>
            
            <!-- Actions Footer -->
            <div class="border-t border-gray-200 flex items-center justify-end gap-4 px-6 py-4">
                <button 
                    type="button"
                    (click)="onCancel()"
                    class="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    (click)="onSave()" 
                    [disabled]="editApprovers.length === 0"
                    class="rounded-lg bg-[#0E0F6B] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a0b4d] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
        ::ng-deep .mat-mdc-dialog-container {
            padding: 0 !important;
        }
        ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
            min-width: 550px;
            max-width: 600px;
            overflow: visible !important;
        }
        ::ng-deep .mat-mdc-dialog-title {
            padding: 0 !important;
            margin: 0 !important;
        }
        ::ng-deep .mat-mdc-dialog-content {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
        }
    `]
})
export class EditApprovalDialogComponent implements OnInit {
    editApprovers: any[] = [];
    searchQuery: string = '';
    dropdownOpen: boolean = false;
    filteredUsers: any[] = [];

    private readonly avatarColors = [
        'bg-indigo-400', 'bg-orange-400', 'bg-teal-400', 'bg-purple-400',
        'bg-blue-400', 'bg-pink-400', 'bg-green-400', 'bg-red-400',
        'bg-cyan-400', 'bg-amber-400', 'bg-lime-500', 'bg-rose-400',
    ];

    private readonly _hrisApiUrl: string;

    constructor(
        public dialogRef: MatDialogRef<EditApprovalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EditApprovalDialogData,
        private _httpClient: HttpClient,
        private _elRef: ElementRef
    ) {
        this._hrisApiUrl = data.hrisApiUrl
            .replace(/\/$/, '')
            .replace(/\/api$/, '');
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.dropdownOpen) return;
        const target = event.target as HTMLElement;
        const dropdownContainer = this._elRef.nativeElement.querySelector('.relative');
        if (dropdownContainer && !dropdownContainer.contains(target)) {
            this.dropdownOpen = false;
        }
    }

    ngOnInit(): void {
        // Copy existing approvers
        this.editApprovers = this.data.approvalItems.map((item: any) => ({
            id: item.user_id,
            name: item.user?.name,
            department_id: item.user?.department_id,
            photo: item.user?.photo,
            level: item.level || 1
        }));

        // Load all users initially
        this.loadAllUsers();
    }

    loadAllUsers(): void {
        this._httpClient
            .get<any>(`${this.data.backendApiUrl}/users`, {
                params: {
                    per_page: '100'
                }
            })
            .subscribe((response) => {
                if (response && response.data) {
                    // Filter out already selected approvers
                    this.filteredUsers = response.data.filter((user: any) => 
                        !this.editApprovers.some(approver => approver.id === user.id)
                    );
                }
            });
    }

    toggleDropdown(): void {
        this.dropdownOpen = !this.dropdownOpen;
        if (this.dropdownOpen) {
            this.searchQuery = '';
            this.loadAllUsers();
        }
    }

    getAvatarUrl(photo: string | null | undefined): string {
        if (!photo) {
            return 'assets/images/avatars/male-01.jpg';
        }
        return `${this._hrisApiUrl}/assets/img/user/${photo}`;
    }

    getAvatarColor(name: string): string {
        const index = name?.charCodeAt(0) % this.avatarColors.length || 0;
        return this.avatarColors[index];
    }

    searchApprovers(): void {
        if (!this.searchQuery || this.searchQuery.length < 2) {
            this.loadAllUsers();
            return;
        }

        this._httpClient
            .get<any>(`${this.data.backendApiUrl}/users`, {
                params: {
                    search: this.searchQuery,
                    per_page: '50'
                }
            })
            .subscribe((response) => {
                if (response && response.data) {
                    // Filter out already selected approvers
                    this.filteredUsers = response.data.filter((user: any) => 
                        !this.editApprovers.some(approver => approver.id === user.id)
                    );
                }
            });
    }

    selectApprover(user: any): void {
        this.editApprovers.push({
            id: user.id,
            name: user.name,
            department_id: user.department_id,
            photo: user.photo,
            level: this.editApprovers.length + 1
        });

        // Remove from filtered list
        this.filteredUsers = this.filteredUsers.filter(u => u.id !== user.id);
        
        // Close dropdown after selection
        this.dropdownOpen = false;
        this.searchQuery = '';
    }

    removeApprover(index: number): void {
        const removed = this.editApprovers[index];
        this.editApprovers.splice(index, 1);
        
        // Update levels
        this.editApprovers.forEach((approver, i) => {
            approver.level = i + 1;
        });

        // Add back to filtered list if dropdown is open
        if (this.dropdownOpen) {
            this.loadAllUsers();
        }
    }

    updateApproverLevel(index: number, level: number): void {
        this.editApprovers[index].level = level;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.editApprovers);
    }
}
