import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
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
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, finalize, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { User } from 'app/modules/admin/master-data/users/user.types';
import { Team } from 'app/modules/admin/master-data/teams/team.types';
import { TicketService, TicketCreateRequest, PRIORITY_MAP } from '../ticket.service';
import { UserService } from 'app/core/user/user.service';
import { SnackbarService } from 'app/core/services/snackbar.service';

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
        TranslocoModule,
    ],
    templateUrl: './create.component.html',
})
export class CreateComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];
    assignType: 'member' | 'team' = 'member';
    selectedAssignee: any = null;
    isSubmitting = false;
    currentUser: any = null;

    // ── Requester mode ──────────────────────────────────────────
    requesterMode: 'select_employee' | 'by_input' = 'select_employee';

    // ── Employee autocomplete ───────────────────────────────────
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

    // ── Assignment data from API ─────────────────────────────────
    memberList: User[] = [];
    teamList: Team[] = [];
    isLoadingAssignment = false;
    assignOptions: Array<{ id: any; name: string; initial: string; color: string; avatar: string | null }> = [];
    private assignDataLoaded = false; // track if initial load done

    // ── Custom assign dropdown ───────────────────────────────────
    assignSearchQuery = '';
    assignDropdownOpen = false;
    private assignSearch$ = new Subject<string>();

    // ── Approvers dropdown ───────────────────────────────────────
    approverSearchQuery = '';
    approverDropdownOpen = false;
    selectedApprovers: any[] = [];
    approverOptions: Array<{ id: any; name: string; initial: string; color: string; avatar: string | null }> = [];
    isLoadingApprovers = false;
    private approverSearch$ = new Subject<string>();
    private approverDataLoaded = false;

    // ── Avatar color palette ─────────────────────────────────────
    private readonly avatarColors = [
        'bg-indigo-400', 'bg-orange-400', 'bg-teal-400', 'bg-purple-400',
        'bg-blue-400', 'bg-pink-400', 'bg-green-400', 'bg-red-400',
        'bg-cyan-400', 'bg-amber-400', 'bg-lime-500', 'bg-rose-400',
    ];

    // ── API URLs ─────────────────────────────────────────────────
    private readonly backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'http://127.0.0.1:9010/api';

    private readonly hrisApiUrl: string =
        (globalThis as any)?.__env?.HRIS_API_URL ||
        (globalThis as any)?.process?.env?.HRIS_API_URL ||
        (globalThis as any)?.HRIS_API_URL ||
        'https://back.siglab.co.id';

    private readonly employeeApiUrl: string;
    private readonly employeePhotoBaseUrl: string;

    // ── Static dropdown options ──────────────────────────────────
    priorities = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
    departments: Array<{ id: string; name: string }> = [];
    isLoadingDepartments = false;
    helpTopics = ['General Inquiry', 'Technical Support', 'Billing', 'Sales', 'Other'];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private _httpClient: HttpClient,
        private _elRef: ElementRef,
        private _ticketService: TicketService,
        private _userService: UserService,
        private _snackbar: SnackbarService,
        private _translocoService: TranslocoService,
    ) {
        // Build HRIS URLs
        const normalizedHris = this.hrisApiUrl.replace(/\/$/, '');
        if (normalizedHris.endsWith('/api')) {
            this.employeeApiUrl = `${normalizedHris}/hris/employee`;
        } else {
            this.employeeApiUrl = `${normalizedHris}/api/hris/employee`;
        }
        this.employeePhotoBaseUrl = normalizedHris.replace(/\/api$/, '');

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
            closeOnResponse: [false],
            approvalRequired: [false],
            priority: ['Low'],
            assignType: ['member'],
            assignTo: [''],
            notifyOnResponse: [false],
        });

        // Filter employee list as user types
        this.employeeInput.valueChanges.subscribe((val) => {
            const q = (val || '').toString().toLowerCase();
            this.filteredEmployeesList = this.employees.filter(
                (u) =>
                    (u.fullName || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q)
            );
        });
        // Debounced search for assign dropdown
        this.assignSearch$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((query) => {
                this._loadAssignmentData(query);
            });
        
        // Debounced search for approver dropdown
        this.approverSearch$
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe((query) => {
                this._loadApprovers(query);
            });
    }

    ngOnInit(): void {
        // Get current user info
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
        });
        // Load departments from API
        this._loadDepartments();
        // Assignment data is lazy-loaded when dropdown opens
    }

    // ─────────────────────────────────────────────────────────────
    // Assignment: lazy-load from API when dropdown opens
    // ─────────────────────────────────────────────────────────────
    private _loadAssignmentData(search: string = ''): void {
        this.isLoadingAssignment = true;
        const base = this.backendApiUrl.replace(/\/$/, '');
        const searchTrim = search.trim();

        if (this.assignType === 'member') {
            let params = new HttpParams().set('per_page', '50');
            if (searchTrim) params = params.set('search', searchTrim);

            this._httpClient.get<any>(`${base}/users`, { params })
                .pipe(
                    catchError(() => of(null)),
                    finalize(() => { this.isLoadingAssignment = false; })
                )
                .subscribe((res) => {
                    const rows = Array.isArray(res?.data) ? res.data : [];
                    const photoBase = this.hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
                    this.memberList = rows
                        .filter((row: any) => {
                            const role = Number(row?.role ?? 0);
                            return role === 1 || role === 2;
                        })
                        .map((row: any) => this._mapApiUser(row, photoBase));
                    this._buildAssignOptions();
                    if (!searchTrim) this.assignDataLoaded = true;
                });
        } else {
            let params = new HttpParams().set('per_page', '50');
            if (searchTrim) params = params.set('search', searchTrim);

            this._httpClient.get<any>(`${base}/teams`, { params })
                .pipe(
                    catchError(() => of(null)),
                    finalize(() => { this.isLoadingAssignment = false; })
                )
                .subscribe((res) => {
                    const rows = Array.isArray(res?.data) ? res.data : [];
                    this.teamList = rows.map((row: any) => ({
                        id: row?.id,
                        name: row?.name ?? '',
                        description: row?.description ?? '',
                        members: [],
                        status: Number(row?.status ?? 1) === 0 ? 'Inactive' : 'Active',
                    } as Team));
                    this._buildAssignOptions();
                    if (!searchTrim) this.assignDataLoaded = true;
                });
        }
    }

    private _mapApiUser(row: any, photoBase: string): User {
        const photo = row?.photo || '';
        const roleNumber = Number(row?.role ?? 0);
        const role = roleNumber === 3 ? 'Admin'
            : roleNumber === 2 ? 'Technical'
                : roleNumber === 1 ? 'Agent' : 'User';
        return {
            id: row?.id,
            fullName: row?.name ?? '',
            email: row?.email ?? '',
            role: role as User['role'],
            status: Number(row?.status ?? 1) === 0 ? 'Inactive' : 'Active',
            department: row?.department?.name ?? '',
            avatar: photo ? `${photoBase}/assets/img/user/${photo}` : 'assets/images/avatars/male-01.jpg',
            photo,
        };
    }

    // ── Assign helpers ──────────────────────────────────────────
    private _buildAssignOptions(): void {
        if (this.assignType === 'member') {
            this.assignOptions = this.memberList.map((u, i) => ({
                id: u.id,
                name: u.fullName,
                initial: this.getInitialOf(u.fullName),
                color: this.avatarColors[i % this.avatarColors.length],
                avatar: u.avatar && !u.avatar.includes('male-01') ? u.avatar : null,
            }));
        } else {
            this.assignOptions = this.teamList.map((t, i) => ({
                id: t.id,
                name: t.name,
                initial: this.getInitialOf(t.name),
                color: this.avatarColors[i % this.avatarColors.length],
                avatar: null,
            }));
        }
    }

    onAssignTypeChange(): void {
        this.selectedAssignee = null;
        this.assignSearchQuery = '';
        this.assignDropdownOpen = false;
        this.assignDataLoaded = false;
        this.assignOptions = [];
        this.form.patchValue({ assignTo: '', assignType: this.assignType });
    }

    toggleAssignDropdown(): void {
        this.assignDropdownOpen = !this.assignDropdownOpen;
        if (this.assignDropdownOpen) {
            this.assignSearchQuery = '';
            // Fetch data from API when dropdown opens
            if (!this.assignDataLoaded) {
                this._loadAssignmentData();
            }
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        
        // Check assign dropdown
        if (this.assignDropdownOpen) {
            const dropdownContainer = this._elRef.nativeElement.querySelector('.assign-dropdown-container');
            if (dropdownContainer && !dropdownContainer.contains(target)) {
                this.assignDropdownOpen = false;
            }
        }
        
        // Check approver dropdown
        if (this.approverDropdownOpen) {
            const approverContainer = this._elRef.nativeElement.querySelector('.approver-dropdown-container');
            if (approverContainer && !approverContainer.contains(target)) {
                this.approverDropdownOpen = false;
            }
        }
    }

    onAssignSearchInput(): void {
        // Trigger debounced API search
        this.assignSearch$.next(this.assignSearchQuery);
    }

    selectAssignee(opt: any): void {
        this.selectedAssignee = opt;
        this.assignDropdownOpen = false;
        this.assignSearchQuery = '';
        this.form.patchValue({ assignTo: opt?.name ?? '' });
    }

    getAssigneeOpt(): any {
        if (!this.selectedAssignee) return null;
        return this.selectedAssignee;
    }

    clearAssignee(): void {
        this.selectedAssignee = null;
        this.form.patchValue({ assignTo: '' });
    }

    // ─────────────────────────────────────────────────────────────
    // Approvers dropdown
    // ─────────────────────────────────────────────────────────────
    private _loadApprovers(search: string = ''): void {
        this.isLoadingApprovers = true;
        const base = this.backendApiUrl.replace(/\/$/, '');
        const searchTrim = search.trim();

        let params = new HttpParams().set('per_page', '50');
        if (searchTrim) params = params.set('search', searchTrim);

        this._httpClient.get<any>(`${base}/users`, { params })
            .pipe(
                catchError(() => of(null)),
                finalize(() => { this.isLoadingApprovers = false; })
            )
            .subscribe((res) => {
                const rows = Array.isArray(res?.data) ? res.data : [];
                const photoBase = this.hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
                const users = rows
                    .filter((row: any) => {
                        const role = Number(row?.role ?? 0);
                        // Filter for Admin, Agent, or Technical
                        return role === 1 || role === 2 || role === 3;
                    })
                    .map((row: any) => this._mapApiUser(row, photoBase));
                
                this.approverOptions = users.map((u, i) => ({
                    id: u.id,
                    name: u.fullName,
                    initial: this.getInitialOf(u.fullName),
                    color: this.avatarColors[i % this.avatarColors.length],
                    avatar: u.avatar && !u.avatar.includes('male-01') ? u.avatar : null,
                }));
                
                if (!searchTrim) this.approverDataLoaded = true;
            });
    }

    toggleApproverDropdown(): void {
        this.approverDropdownOpen = !this.approverDropdownOpen;
        if (this.approverDropdownOpen) {
            this.approverSearchQuery = '';
            if (!this.approverDataLoaded) {
                this._loadApprovers();
            }
        }
    }

    onApproverSearchInput(): void {
        this.approverSearch$.next(this.approverSearchQuery);
    }

    selectApprover(opt: any): void {
        // Check if already selected
        const exists = this.selectedApprovers.find(a => a.id === opt.id);
        if (!exists) {
            this.selectedApprovers.push({
                ...opt,
                level: 1 // Default level
            });
        }
        this.approverSearchQuery = '';
    }

    removeApprover(index: number): void {
        this.selectedApprovers.splice(index, 1);
    }

    clearAllApprovers(): void {
        this.selectedApprovers = [];
    }

    isApproverSelected(optId: any): boolean {
        return this.selectedApprovers.some(a => a.id === optId);
    }

    updateApproverLevel(index: number, level: number): void {
        if (this.selectedApprovers[index]) {
            this.selectedApprovers[index].level = level;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Requester mode
    // ─────────────────────────────────────────────────────────────
    onRequesterModeChange(): void {
        this.selectedEmployee = null;
        this.employeeInput.setValue('', { emitEvent: false });
        this.form.patchValue({ email: '', fullName: '', phone: '' });
    }

    // ─────────────────────────────────────────────────────────────
    // Employee Autocomplete
    // ─────────────────────────────────────────────────────────────
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
            const reachedBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - threshold;
            if (reachedBottom) this._loadEmployees();
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
        this.employeeInput.setValue(this.employeeDisplay(user), { emitEvent: false });
        this.employeeChanged = true;
        
        // Auto-fill form fields from selected employee
        const phoneNumber = (user as any).phone || '';
        this.form.patchValue({
            email: user.email,
            fullName: user.fullName,
            phone: phoneNumber.startsWith('62') ? phoneNumber : '62' + phoneNumber,
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
        return this.avatarColors[index % this.avatarColors.length];
    }

    getEmployeeIndex(emp: User): number {
        return this.employees.findIndex(e => e.id === emp.id);
    }

    // ─────────────────────────────────────────────────────────────
    // Private: load employees from HRIS API
    // ─────────────────────────────────────────────────────────────
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
                if (!list.length) { this.hasMoreEmployees = false; return; }
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
        // Get email from email_kantor from HRIS API
        // Use item?.selfupdate?.email_kantor as the primary source
        const emailKantor = item?.selfupdate?.email_kantor ?? '';
        const email = emailKantor && emailKantor.includes('@') ? emailKantor : '';
        
        // Use user_id as the primary ID for backend
        const userId = Number(item?.user_id ?? item?.id ?? 0);
        
        // Get phone number from selfupdate or employee data
        const phone = item?.selfupdate?.phone_number ?? item?.employee?.phone ?? item?.phone ?? '';
        
        return {
            id: userId, // This will be sent as requester_id to backend
            employeeId: Number(item?.employee_id ?? item?.id ?? 0),
            hrisUserId: userId,
            userId: userId,
            fullName: item?.employee_name ?? item?.name ?? item?.employee?.name ?? '-',
            email: email,
            phone: phone,
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
            const reachedBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - threshold;
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
            if (panel.scrollHeight <= panel.clientHeight + 2) this._loadEmployees();
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Drag & Drop
    // ─────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────
    // Form actions
    // ─────────────────────────────────────────────────────────────
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;

        // Prepare data for API
        const formValue = this.form.value;
        const ticketData: TicketCreateRequest = {
            requester_type: this.requesterMode, // Add requester type
            name: formValue.fullName,
            email: formValue.email,
            phone_number: formValue.phone || '',
            extension_number: formValue.extension || '',
            ticket_source: formValue.ticketSource,
            department_id: formValue.department || '',
            help_topic: formValue.helpTopic || '',
            subject_issue: formValue.subject,
            issue_detail: formValue.issueDetail,
            priority: PRIORITY_MAP[formValue.priority] ?? 0, // Convert string to number
            assign_status: this.assignType,
        };

        // Add Response & Notes fields
        if (formValue.response) {
            (ticketData as any).response = formValue.response;
        }
        if (formValue.internalNote) {
            (ticketData as any).internal_note = formValue.internalNote;
        }
        if (formValue.markInternal !== null && formValue.markInternal !== undefined) {
            (ticketData as any).mark_internal = formValue.markInternal ? '1' : '0';
        }
        
        // Add Close on Response field
        if (formValue.closeOnResponse !== null && formValue.closeOnResponse !== undefined) {
            (ticketData as any).close_on_response = formValue.closeOnResponse ? '1' : '0';
        }
        
        // Add Approval Required field
        if (formValue.approvalRequired !== null && formValue.approvalRequired !== undefined) {
            (ticketData as any).approval_required = formValue.approvalRequired ? '1' : '0';
        }
        
        // Add Approvers if approval is required
        if (formValue.approvalRequired && this.selectedApprovers.length > 0) {
            // Send approvers with level information as JSON string
            (ticketData as any).approver_ids = JSON.stringify(
                this.selectedApprovers.map(a => ({
                    user_id: a.id,
                    level: a.level || 1
                }))
            );
        }

        // Add requester_id if employee is selected
        if (this.selectedEmployee?.id) {
            ticketData.requester_id = this.selectedEmployee.id;
            // Add photo if available
            if (this.selectedEmployee.photo) {
                (ticketData as any).requester_photo = this.selectedEmployee.photo;
            }
        }

        // Add assignment based on type
        if (this.selectedAssignee?.id) {
            if (this.assignType === 'member') {
                // For member assignment, use pic_technical_id
                ticketData.pic_technical_id = this.selectedAssignee.id;
            } else if (this.assignType === 'team') {
                // For team assignment, use team_id
                ticketData.team_id = this.selectedAssignee.id;
            }
        }

        // Add pic_helpdesk_id (current user if agent role)
        if (this.currentUser?.id) {
            ticketData.pic_helpdesk_id = this.currentUser.id;
        }

        // Add role from user context (lowercase role_name)
        if (this.currentUser?.role_name) {
            ticketData.role = this.currentUser.role_name.toLowerCase();
        } else if (this.currentUser?.role) {
            // Fallback: if role_name not available, use role property
            ticketData.role = this.currentUser.role.toLowerCase();
        } else {
            // Default to 'user' if no role found
            ticketData.role = 'user';
        }

        console.log('Ticket data to submit:', ticketData);

        // Create FormData for file upload
        const formData = new FormData();
        
        // Append all ticket data
        Object.keys(ticketData).forEach(key => {
            const value = ticketData[key];
            if (value !== null && value !== undefined) {
                // All values are already strings or primitives
                // JSON arrays are already stringified
                formData.append(key, value);
            }
        });
        
        // Append files if any
        if (this.uploadedFiles.length > 0) {
            this.uploadedFiles.forEach((file) => {
                formData.append('attachments[]', file, file.name);
            });
        }

        // Debug: Log FormData contents
        console.log('FormData contents:');
        formData.forEach((value, key) => {
            console.log(`${key}:`, value);
        });

        this._ticketService
            .createTicketWithFiles(formData)
            .pipe(
                catchError((error) => {
                    console.error('Error creating ticket:', error);
                    this._snackbar.error(
                        error?.error?.message ||
                            this._translocoService.translate('TICKETS.MESSAGES.CREATE_FAILED')
                    );
                    return of(null);
                }),
                finalize(() => {
                    this.isSubmitting = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status) {
                    this._snackbar.success(
                        response.message || this._translocoService.translate('TICKETS.MESSAGES.CREATED_SUCCESS')
                    );
                    this.router.navigate(['/tickets/data']);
                }
            });
    }

    onSaveDraft(): void { console.log('Draft saved:', this.form.value); }
    
    onReset(): void {
        this.form.reset({
            email: '',
            fullName: '',
            phone: '',
            extension: '',
            ticketSource: '',
            department: '',
            helpTopic: '',
            subject: '',
            issueDetail: '',
            response: '',
            markInternal: false,
            internalNote: '',
            closeOnResponse: false,
            approvalRequired: false,
            priority: 'Low',
            assignType: 'member',
            assignTo: '',
            notifyOnResponse: false,
        });
        this.selectedEmployee = null;
        this.selectedAssignee = null;
        this.selectedApprovers = [];
        this.uploadedFiles = [];
        this.employeeInput.setValue('', { emitEvent: false });
        this.assignSearchQuery = '';
        this.approverSearchQuery = '';
        this._snackbar.success(this._translocoService.translate('TICKETS.MESSAGES.FORM_RESET'));
    }
    
    onCancel(): void { this.router.navigate(['/tickets/data']); }
    backToTickets(): void { this.router.navigate(['/tickets/data']); }

    // ─────────────────────────────────────────────────────────────
    // Load departments from API
    // ─────────────────────────────────────────────────────────────
    private _loadDepartments(): void {
        this.isLoadingDepartments = true;
        this._httpClient.get<any>(`${this.backendApiUrl}/departments?per_page=100`)
            .pipe(
                catchError((error) => {
                    console.error('Error loading departments:', error);
                    this._snackbar.error('Failed to load departments');
                    return of({ status: false, data: [] });
                }),
                finalize(() => {
                    this.isLoadingDepartments = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    this.departments = response.data.map((dept: any) => ({
                        id: dept.id,
                        name: dept.name
                    }));
                    console.log('Departments loaded:', this.departments);
                }
            });
    }

    ngOnDestroy(): void {
        this._stopPanelWatcher();
        this._detachPanelScrollListener();
    }
}
