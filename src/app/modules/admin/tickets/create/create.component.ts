import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { User } from 'app/modules/admin/master-data/users/user.types';

@Component({
    selector: 'app-create',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatAutocompleteModule,
    ],
    templateUrl: './create.component.html',
})
export class CreateComponent implements OnDestroy {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];
    assignType: 'member' | 'team' = 'member';
    selectedAssignee = '';

    // ── Requester mode ──────────────────────────────────────────
    requesterMode: 'select_employee' | 'by_input' = 'select_employee';

    // ── Employee autocomplete (same pattern as user-dialog) ─────
    employeeInput: FormControl<string | null> = new FormControl('');
    filteredEmployeesList: User[] = [];
    employees: User[] = [];
    isLoadingEmployees = false;
    hasMoreEmployees = true;
    selectedEmployee: User | null = null;

    private currentEmployeePage = 1;
    private employeeChanged = false;
    private panelScrollElement: HTMLElement | null = null;
    private panelScrollHandler: ((event: Event) => void) | null = null;
    private panelWatcher: ReturnType<typeof setInterval> | null = null;

    private readonly hrisApiUrl: string =
        (globalThis as any)?.__env?.HRIS_API_URL ||
        (globalThis as any)?.process?.env?.HRIS_API_URL ||
        (globalThis as any)?.HRIS_API_URL ||
        'https://back.siglab.co.id';

    private readonly employeeApiUrl: string = this._buildEmployeeApiUrl();
    private readonly employeePhotoBaseUrl: string = this._buildEmployeePhotoBaseUrl();

    // ── Static options ───────────────────────────────────────────
    priorities = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
    departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
    helpTopics = ['General Inquiry', 'Technical Support', 'Billing', 'Sales', 'Other'];
    slaOptions = ['Default', '4 Hours', '8 Hours', '24 Hours', '48 Hours'];
    roleOptions = ['External', 'Internal', 'Partner', 'VIP'];

    members = [
        { name: 'Alice', avatar: 'A', color: 'bg-indigo-400', image: 'images/avatars/female-01.jpg' },
        { name: 'Jonathan', avatar: 'J', color: 'bg-orange-400', image: 'images/avatars/male-01.jpg' },
        { name: 'Smith', avatar: 'S', color: 'bg-teal-400', image: 'images/avatars/male-02.jpg' },
        { name: 'Vincent', avatar: 'V', color: 'bg-purple-400', image: 'images/avatars/male-03.jpg' },
        { name: 'Chris', avatar: 'C', color: 'bg-blue-400', image: 'images/avatars/male-04.jpg' },
    ];

    teams = [
        { name: 'IT Support', color: 'bg-indigo-400' },
        { name: 'Network Team', color: 'bg-blue-400' },
        { name: 'HR Department', color: 'bg-pink-400' },
        { name: 'Finance Team', color: 'bg-yellow-400' },
        { name: 'Operations', color: 'bg-teal-400' },
    ];

    assignOptions: any[] = [];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private _httpClient: HttpClient,
    ) {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', Validators.required],
            phone: [''],
            extension: [''],
            ticketSource: ['', Validators.required],
            department: [''],
            helpTopic: [''],
            subject: ['', Validators.required],
            issueDetail: ['', Validators.required],
            response: [''],
            markInternal: [false],
            internalNote: [''],
            priority: ['Low'],
            role: ['External'],
            assignType: ['member'],
            assignTo: [''],
            sla: ['Default'],
            notifyOnResponse: [false],
        });
        this.updateAssignOptions();

        // Filter list saat user mengetik di autocomplete
        this.employeeInput.valueChanges.subscribe((val) => {
            const q = (val || '').toString().toLowerCase();
            this.filteredEmployeesList = this.employees.filter(
                (u) =>
                    (u.fullName || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q)
            );
        });
    }

    // ── Requester mode ──────────────────────────────────────────
    onRequesterModeChange(): void {
        this.selectedEmployee = null;
        this.employeeInput.setValue('', { emitEvent: false });
        this.form.patchValue({ email: '', fullName: '', phone: '' });
    }

    // ── Employee Autocomplete (sama persis dengan user-dialog) ──

    enableEmployeeAutocomplete(trigger: MatAutocompleteTrigger): void {
        if (!this.employees.length && this.hasMoreEmployees) {
            this._loadEmployees();
        }
        this.employeeChanged = false;
        this.employeeInput.setValue('', { emitEvent: true });
        this.filteredEmployeesList = this.employees;
        trigger?.openPanel?.();
    }

    onEmployeePanelOpened(trigger: MatAutocompleteTrigger): void {
        const panel = trigger.autocomplete?.panel?.nativeElement as HTMLElement;
        if (!panel) {
            this._startPanelWatcher(trigger);
            return;
        }
        this._detachPanelScrollListener();
        this.panelScrollElement = panel;
        this.panelScrollHandler = () => {
            const threshold = 80;
            const reachedBottom =
                panel.scrollTop + panel.clientHeight >= panel.scrollHeight - threshold;
            if (reachedBottom) {
                this._loadEmployees();
            }
        };
        panel.addEventListener('scroll', this.panelScrollHandler);
        this._startPanelWatcher(trigger);
        this._ensureScrollableData();
    }

    onEmployeePanelClosed(): void {
        this._stopPanelWatcher();
        this._detachPanelScrollListener();
        if (this.employeeChanged) return;
        if (this.selectedEmployee) {
            this.employeeInput.setValue(this.employeeDisplay(this.selectedEmployee), { emitEvent: false });
        } else {
            this.employeeInput.setValue('', { emitEvent: false });
        }
    }

    onEmployeeSelected(user: User): void {
        this.selectedEmployee = user;
        console.log(user);
        this.employeeInput.setValue(this.employeeDisplay(user), { emitEvent: false });
        this.employeeChanged = true;
        // Auto-fill form fields
        this.form.patchValue({
            email: user.email,
            fullName: user.fullName,
            phone: '62' + (user as any).phone || '',
        });
    }

    clearEmployee(): void {
        this.selectedEmployee = null;
        this.employeeInput.setValue('', { emitEvent: true });
        this.form.patchValue({ email: '', fullName: '', phone: '' });
    }

    employeeDisplay = (user: User | null): string => {
        if (!user) return '';
        return `${user.fullName} (${user.email})`;
    };

    getInitialOf(name: string): string {
        return (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    }

    getAvatarColor(index: number): string {
        const colors = [
            'bg-indigo-400', 'bg-orange-400', 'bg-teal-400', 'bg-purple-400',
            'bg-blue-400', 'bg-pink-400', 'bg-green-400', 'bg-red-400',
        ];
        return colors[index % colors.length];
    }

    getEmployeeIndex(emp: User): number {
        return this.employees.findIndex(e => e.id === emp.id);
    }

    // ── Private: load employees from HRIS API ───────────────────
    private _loadEmployees(): void {
        if (this.isLoadingEmployees || !this.hasMoreEmployees) return;
        this.isLoadingEmployees = true;
        const requestedPage = this.currentEmployeePage;
        const url = `${this.employeeApiUrl}?page=${requestedPage}&company=1`;

        this._httpClient
            .post<any>(url, {})
            .pipe(
                catchError(() => of(null)),
                finalize(() => { this.isLoadingEmployees = false; })
            )
            .subscribe((response) => {
                if (!response) return;
                const list = Array.isArray(response?.data) ? response.data : [];
                if (!list.length) {
                    this.hasMoreEmployees = false;
                    return;
                }
                const beforeCount = this.employees.length;
                const mapped = list.map((item: any) => this._mapEmployee(item));
                this._appendEmployees(mapped);
                const appendedCount = this.employees.length - beforeCount;
                const currentPage = Number(response?.current_page || requestedPage);
                const lastPage = Number(response?.last_page || 0);
                const hasNextFromUrl = Boolean(response?.next_page_url);
                this.hasMoreEmployees =
                    (lastPage > 0 && currentPage < lastPage) || hasNextFromUrl || appendedCount > 0;
                this.currentEmployeePage = requestedPage + 1;

                const search = (this.employeeInput.value || '').toString().toLowerCase();
                this.filteredEmployeesList = this.employees.filter(
                    (u) =>
                        (u.fullName || '').toLowerCase().includes(search) ||
                        (u.email || '').toLowerCase().includes(search)
                );
                this._ensureScrollableData();
            });
    }

    private _appendEmployees(newEmps: User[]): void {
        const map = new Map<string, User>();
        this.employees.forEach(e => map.set(this._userKey(e), e));
        newEmps.forEach(e => map.set(this._userKey(e), e));
        this.employees = Array.from(map.values());
    }

    private _mapEmployee(item: any): User {
        const photo = item?.employee?.photo ?? item?.photo ?? '';
        return {
            id: Number(item?.employee_id ?? item?.user_id ?? item?.id ?? 0),
            employeeId: Number(item?.employee_id ?? item?.id ?? 0),
            hrisUserId: Number(item?.user_id ?? item?.employee_id ?? 0),
            userId: Number(item?.user_id ?? item?.employee_id ?? 0),
            fullName: item?.employee_name ?? item?.name ?? item?.employee?.name ?? '-',
            email: item?.selfupdate.email_kantor ?? item?.nik ?? item?.noktp ?? '-',
            phone: item?.phone ?? '-',
            role: 'User',
            status: 'Active',
            avatar: photo
                ? `${this.employeePhotoBaseUrl}/assets/img/user/${photo}`
                : 'assets/images/avatars/male-01.jpg',
            photo,
        };
    }

    private _userKey(user: User): string {
        return String(user?.id ?? user?.employeeId ?? user?.hrisUserId ?? user?.userId ?? user?.email ?? '');
    }

    private _buildEmployeeApiUrl(): string {
        const normalized = this.hrisApiUrl.replace(/\/$/, '');
        if (normalized.endsWith('/api')) return `${normalized}/hris/employee`;
        return `${normalized}/api/hris/employee`;
    }

    private _buildEmployeePhotoBaseUrl(): string {
        return this.hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
    }

    private _detachPanelScrollListener(): void {
        if (!this.panelScrollElement || !this.panelScrollHandler) return;
        this.panelScrollElement.removeEventListener('scroll', this.panelScrollHandler);
        this.panelScrollElement = null;
        this.panelScrollHandler = null;
    }

    private _startPanelWatcher(trigger: MatAutocompleteTrigger): void {
        this._stopPanelWatcher();
        this.panelWatcher = setInterval(() => {
            const panel = trigger.autocomplete?.panel?.nativeElement as HTMLElement;
            if (!panel) return;
            this.panelScrollElement = panel;
            const threshold = 80;
            const reachedBottom =
                panel.scrollTop + panel.clientHeight >= panel.scrollHeight - threshold;
            if (reachedBottom) { this._loadEmployees(); return; }
            if (panel.scrollHeight <= panel.clientHeight + 2) { this._loadEmployees(); }
        }, 250);
    }

    private _stopPanelWatcher(): void {
        if (this.panelWatcher) {
            clearInterval(this.panelWatcher);
            this.panelWatcher = null;
        }
    }

    private _ensureScrollableData(): void {
        setTimeout(() => {
            if (!this.panelScrollElement || this.isLoadingEmployees || !this.hasMoreEmployees) return;
            const panel = this.panelScrollElement;
            const hasScrollbar = panel.scrollHeight > panel.clientHeight + 2;
            if (!hasScrollbar) this._loadEmployees();
        });
    }

    // ── Assign helpers ──────────────────────────────────────────
    updateAssignOptions(): void {
        this.assignOptions = this.assignType === 'member'
            ? this.members.map((m) => ({ name: m.name, initial: m.avatar, color: m.color, image: m.image }))
            : this.teams.map((t) => ({ name: t.name, initial: t.name.charAt(0), color: t.color, image: null }));
    }

    onAssignTypeChange(): void {
        this.selectedAssignee = '';
        this.form.patchValue({ assignTo: '', assignType: this.assignType });
        this.updateAssignOptions();
    }

    onAssigneeChange(): void { this.form.patchValue({ assignTo: this.selectedAssignee }); }

    getAssigneeColor(name: string): string {
        const all = [
            ...this.members.map((m) => ({ name: m.name, color: m.color })),
            ...this.teams.map((t) => ({ name: t.name, color: t.color })),
        ];
        return all.find((a) => a.name === name)?.color ?? 'bg-indigo-400';
    }

    getAssigneeInitial(name: string): string {
        if (!name) return '';
        const member = this.members.find((m) => m.name === name);
        return member ? member.avatar : name.charAt(0).toUpperCase();
    }

    getAssigneeImage(name: string): string | null {
        if (!name) return null;
        const member = this.members.find((m: any) => m.name === name);
        return member?.image || null;
    }

    clearAssignee(): void {
        this.selectedAssignee = '';
        this.form.patchValue({ assignTo: '' });
    }

    // ── Drag & Drop ──────────────────────────────────────────────
    onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging = true; }
    onDragLeave(): void { this.isDragging = false; }
    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
        const files = event.dataTransfer?.files;
        if (files) this.addFiles(Array.from(files));
    }
    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) this.addFiles(Array.from(input.files));
    }
    addFiles(files: File[]): void { this.uploadedFiles.push(...files); }
    removeFile(index: number): void { this.uploadedFiles.splice(index, 1); }
    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    }

    // ── Form actions ─────────────────────────────────────────────
    onSubmit(): void {
        if (this.form.valid) {
            console.log('Submit:', this.form.value);
        } else {
            this.form.markAllAsTouched();
        }
    }

    onSaveDraft(): void { console.log('Draft saved:', this.form.value); }
    onCancel(): void { this.router.navigate(['/tickets/data']); }
    backToTickets(): void { this.router.navigate(['/tickets/data']); }

    ngOnDestroy(): void {
        this._stopPanelWatcher();
        this._detachPanelScrollListener();
    }
}
