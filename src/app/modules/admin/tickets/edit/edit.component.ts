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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, finalize, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { User } from 'app/modules/admin/master-data/users/user.types';
import { Team } from 'app/modules/admin/master-data/teams/team.types';
import { TicketService, PRIORITY_MAP } from '../ticket.service';
import { UserService } from 'app/core/user/user.service';
import { SnackbarService } from 'app/core/services/snackbar.service';

@Component({
    selector: 'app-edit',
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
    templateUrl: './edit.component.html',
})
export class EditComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isDragging = false;
    uploadedFiles: File[] = [];
    assignType: 'member' | 'team' = 'member';
    selectedAssignee: any = null;
    isSubmitting = false;
    isLoading = false;
    currentUser: any = null;
    ticketId: string = '';
    ticketData: any = null;

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
    departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
    helpTopics = ['General Inquiry', 'Technical Support', 'Billing', 'Sales', 'Other'];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
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
    }

    ngOnInit(): void {
        // Get ticket ID from route
        this.ticketId = this.route.snapshot.paramMap.get('id') || '';
        
        // Get current user info
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
        });

        // Load ticket data
        if (this.ticketId) {
            this.loadTicketData();
        } else {
            this._snackbar.error(this._translocoService.translate('TICKETS.MESSAGES.INVALID_ID'));
            this.router.navigate(['/tickets/data']);
        }
    }

    private loadTicketData(): void {
        this.isLoading = true;
        
        this._ticketService.getTicket(this.ticketId)
            .pipe(
                catchError((error) => {
                    console.error('Error loading ticket:', error);
                    this._snackbar.error(
                        error?.error?.message || this._translocoService.translate('TICKETS.MESSAGES.LOAD_FAILED')
                    );
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe((response) => {
                if (response && response.status && response.data) {
                    this.ticketData = response.data;
                    this.populateForm();
                } else {
                    this._snackbar.error(this._translocoService.translate('TICKETS.MESSAGES.NOT_FOUND'));
                    this.router.navigate(['/tickets/data']);
                }
            });
    }

    private populateForm(): void {
        if (!this.ticketData) return;

        // Set requester mode based on saved requester_type
        if (this.ticketData.requester_type) {
            this.requesterMode = this.ticketData.requester_type;
        } else {
            // Fallback logic: if requester relation exists, use select_employee, otherwise by_input
            this.requesterMode = this.ticketData.requester ? 'select_employee' : 'by_input';
        }

        // Get priority string from number
        const priorityString = Object.keys(PRIORITY_MAP).find(
            key => PRIORITY_MAP[key] === this.ticketData.priority
        ) || 'Low';

        // Populate form with ticket data
        this.form.patchValue({
            email: this.ticketData.email || '',
            fullName: this.ticketData.name || '',
            phone: this.ticketData.phone_number || '',
            extension: this.ticketData.extension_number || '',
            ticketSource: this.ticketData.ticket_source || '',
            department: this.ticketData.department_id || '',
            helpTopic: this.ticketData.help_topic || '',
            subject: this.ticketData.subject_issue || '',
            issueDetail: this.ticketData.issue_detail || '',
            priority: priorityString,
            assignType: this.ticketData.assign_status || 'member',
        });

        // Set assign type
        this.assignType = this.ticketData.assign_status || 'member';

        // Set selected assignee if exists
        if (this.assignType === 'member' && this.ticketData.pic_technical) {
            this.selectedAssignee = {
                id: this.ticketData.pic_technical.id,
                name: this.ticketData.pic_technical.name,
                initial: this.getInitialOf(this.ticketData.pic_technical.name),
                color: this.avatarColors[0],
                avatar: this.ticketData.pic_technical.photo ? 
                    `${this.employeePhotoBaseUrl}/assets/img/user/${this.ticketData.pic_technical.photo}` : null,
            };
            this.form.patchValue({ assignTo: this.selectedAssignee.name });
        } else if (this.assignType === 'team' && this.ticketData.team) {
            this.selectedAssignee = {
                id: this.ticketData.team.id,
                name: this.ticketData.team.name,
                initial: this.getInitialOf(this.ticketData.team.name),
                color: this.avatarColors[0],
                avatar: null,
            };
            this.form.patchValue({ assignTo: this.selectedAssignee.name });
        }

        // Set selected employee if requester exists and mode is select_employee
        if (this.requesterMode === 'select_employee' && this.ticketData.requester) {
            this.selectedEmployee = {
                id: this.ticketData.requester.hris_user_id || this.ticketData.requester.id, // Use hris_user_id for backend
                fullName: this.ticketData.requester.name,
                email: this.ticketData.requester.email,
                role: 'User' as User['role'],
                status: 'Active' as User['status'],
                department: this.ticketData.requester.department_id || '',
                avatar: this.ticketData.requester.photo ? 
                    `${this.employeePhotoBaseUrl}/assets/img/user/${this.ticketData.requester.photo}` : 'assets/images/avatars/male-01.jpg',
                photo: this.ticketData.requester.photo || '',
            };
            this.employeeInput.setValue(this.employeeDisplay(this.selectedEmployee), { emitEvent: false });
        }
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
        if (!this.assignDropdownOpen) return;
        const target = event.target as HTMLElement;
        // Check if click is inside the assign dropdown area
        const dropdownContainer = this._elRef.nativeElement.querySelector('.assign-dropdown-container');
        if (dropdownContainer && !dropdownContainer.contains(target)) {
            this.assignDropdownOpen = false;
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
        this.form.patchValue({
            email: user.email,
            fullName: user.fullName,
            phone: '62' + ((user as any).phone || ''),
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
        
        // Use user_id as the primary ID for backend
        const userId = Number(item?.user_id ?? item?.id ?? 0);
        
        return {
            id: userId, // This will be sent as requester_id to backend
            employeeId: Number(item?.employee_id ?? item?.id ?? 0),
            hrisUserId: userId,
            userId: userId,
            fullName: item?.employee_name ?? item?.name ?? item?.employee?.name ?? '-',
            email: item?.selfupdate?.email_kantor ?? item?.nik ?? item?.noktp ?? '-',
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
        const ticketData: any = {
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

        // Create FormData for file upload
        const formData = new FormData();
        
        // Append all ticket data
        Object.keys(ticketData).forEach(key => {
            if (ticketData[key] !== null && ticketData[key] !== undefined) {
                formData.append(key, ticketData[key]);
            }
        });
        
        // Append files if any
        if (this.uploadedFiles.length > 0) {
            this.uploadedFiles.forEach((file) => {
                formData.append('attachments[]', file, file.name);
            });
        }

        this._ticketService
            .updateTicketWithFiles(this.ticketId, formData)
            .pipe(
                catchError((error) => {
                    console.error('Error updating ticket:', error);
                    this._snackbar.error(
                        error?.error?.message ||
                            this._translocoService.translate('TICKETS.MESSAGES.UPDATE_FAILED')
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
                        response.message || this._translocoService.translate('TICKETS.MESSAGES.UPDATED_SUCCESS')
                    );
                    this.router.navigate(['/tickets/data']);
                }
            });
    }

    onSaveDraft(): void { console.log('Draft saved:', this.form.value); }
    onCancel(): void { this.router.navigate(['/tickets/data']); }
    backToTickets(): void { this.router.navigate(['/tickets/data']); }

    ngOnDestroy(): void {
        this._stopPanelWatcher();
        this._detachPanelScrollListener();
    }
}