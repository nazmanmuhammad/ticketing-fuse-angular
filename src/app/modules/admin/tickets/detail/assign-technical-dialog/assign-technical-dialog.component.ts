import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-assign-technical-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatCheckboxModule,
    ],
    templateUrl: './assign-technical-dialog.component.html',
})
export class AssignTechnicalDialogComponent implements OnInit {
    form: FormGroup;
    isSubmitting = false;
    
    // Technical users
    technicalUsers: any[] = [];
    isLoadingTechnical = false;
    technicalSearchQuery = '';
    technicalDropdownOpen = false;
    selectedTechnical: any = null;
    private technicalSearch$ = new Subject<string>();
    
    // Show full form or simple form
    showFullForm = false;
    
    priorities = [
        { value: 1, label: 'Low' },
        { value: 2, label: 'Medium' },
        { value: 3, label: 'High' },
        { value: 4, label: 'Critical' },
        { value: 5, label: 'Emergency' },
    ];

    private readonly backendApiUrl: string;
    private readonly hrisApiUrl: string;

    constructor(
        public dialogRef: MatDialogRef<AssignTechnicalDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { ticket: any; currentUser: any },
        private fb: FormBuilder,
        private _httpClient: HttpClient
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

        // Determine if we should show full form
        this.showFullForm = !data.ticket.pic_technical_id && !data.ticket.pic_helpdesk_id;

        // Initialize form
        this.form = this.fb.group({
            technical_user: [null, Validators.required],
            response: [''],
            internal_note: [''],
            mark_as_internal: [false],
            priority: [null],
        });

        // If full form, make priority required
        if (this.showFullForm) {
            this.form.get('priority')?.setValidators([Validators.required]);
        }

        // Debounced search for technical users
        this.technicalSearch$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((query) => {
                this.loadTechnicalUsers(query);
            });
    }

    ngOnInit(): void {
        this.loadTechnicalUsers('');
    }

    loadTechnicalUsers(query: string = ''): void {
        this.isLoadingTechnical = true;
        
        // Use backend API instead of HRIS
        const url = `${this.backendApiUrl}/users`;
        const params: any = {
            search: query || '',
            per_page: 50,
            role: 2, // Technical role
        };

        this._httpClient.get<any>(url, { params }).subscribe({
            next: (response) => {
                if (response && response.data && Array.isArray(response.data)) {
                    this.technicalUsers = response.data;
                } else {
                    this.technicalUsers = [];
                }
                this.isLoadingTechnical = false;
            },
            error: () => {
                this.technicalUsers = [];
                this.isLoadingTechnical = false;
            },
        });
    }

    onTechnicalSearchChange(query: string): void {
        this.technicalSearchQuery = query;
        this.technicalSearch$.next(query);
    }

    toggleTechnicalDropdown(): void {
        this.technicalDropdownOpen = !this.technicalDropdownOpen;
        if (this.technicalDropdownOpen && this.technicalUsers.length === 0) {
            this.loadTechnicalUsers('');
        }
    }

    selectTechnical(user: any): void {
        this.selectedTechnical = user;
        this.form.patchValue({ technical_user: user.id });
        this.technicalDropdownOpen = false;
        this.technicalSearchQuery = '';
    }

    clearTechnicalSelection(): void {
        this.selectedTechnical = null;
        this.form.patchValue({ technical_user: null });
    }

    getAvatarUrl(photo: string | null | undefined): string {
        if (!photo) {
            return 'assets/images/avatars/male-01.jpg';
        }
        
        const photoBase = this.hrisApiUrl
            .replace(/\/$/, '')
            .replace(/\/api$/, '');
        
        return `${photoBase}/assets/img/user/${photo}`;
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSubmit(): void {
        if (this.form.invalid || !this.selectedTechnical) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.value;
        const result: any = {
            pic_technical_id: this.selectedTechnical.id,
            technical_user: this.selectedTechnical,
        };

        // If full form, include additional fields
        if (this.showFullForm) {
            result.response = formValue.response || '';
            result.internal_note = formValue.internal_note || '';
            result.mark_as_internal = formValue.mark_as_internal || false;
            result.priority = formValue.priority;
        }

        this.dialogRef.close(result);
    }
}
