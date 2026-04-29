import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil, catchError, finalize, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AccessRequestService } from '../access-request.service';
import { UserService } from 'app/core/user/user.service';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { User } from 'app/modules/admin/master-data/users/user.types';
import { Team } from 'app/modules/admin/master-data/teams/team.types';

@Component({
    selector: 'app-create-access-request',
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
        TranslocoModule
    ],
    templateUrl: './create.component.html',
})
export class CreateAccessRequestComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    form: FormGroup;
    uploadedFiles: File[] = [];
    isDragging = false;
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

    // Dropdown states
    assignDropdownOpen = false;
    assignSearchQuery = '';
    isLoadingAssignment = false;

    priorities: any[] = [];
    departments: any[] = [];
    requestTypes: any[] = [];
    accessLevels: any[] = [];
    durationTypes: any[] = [];

    // Assignment data from API
    memberList: User[] = [];
    teamList: Team[] = [];
    assignOptions: Array<{ id: any; name: string; initial: string; color: string; avatar: string | null }> = [];
    private assignDataLoaded = false;
    private assignSearch$ = new Subject<string>();

    // Approvers dropdown
    approverSearchQuery = '';
    approverDropdownOpen = false;
    selectedApprovers: any[] = [];
    approverOptions: Array<{ id: any; name: string; initial: string; color: string; avatar: string | null }> = [];
    isLoadingApprovers = false;
    private approverSearch$ = new Subject<string>();
    private approverDataLoaded = false;

    // Avatar color palette
    private readonly avatarColors = [
        'bg-indigo-400', 'bg-orange-400', 'bg-teal-400', 'bg-purple-400',
        'bg-blue-400', 'bg-pink-400', 'bg-green-400', 'bg-red-400',
        'bg-cyan-400', 'bg-amber-400', 'bg-lime-500', 'bg-rose-400',
    ];

    // API URLs
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

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private translocoService: TranslocoService,
        private _accessRequestService: AccessRequestService,
        private _userService: UserService,
        private _snackbar: SnackbarService,
        private _httpClient: HttpClient,
        private _elRef: ElementRef
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
            department: ['', Validators.required],

            resourceName: ['', Validators.required],
            requestType: ['', Validators.required],
            accessLevel: ['', Validators.required],
            reason: ['', Validators.required],

            durationType: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],

            priority: ['Medium'],
            assignType: ['member'],
            assignTo: [''],

            closeOnResponse: [false],
            approvalRequired: [false],
            notifyRequester: [false],
            requireManagerApproval: [false],
        });
        this.updateAssignOptions();

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
        // Initialize translations first
        this.updateTranslations();
        
        // Get current user
        this._userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
            this.currentUser = user;
            if (this.currentUser) {
                // Auto-fill email and full name
                this.form.patchValue({
                    email: this.currentUser.email || '',
                    fullName: this.currentUser.name || '',
                });
            }
        });

        this.translocoService.events$
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => {
                if (event.type === 'translationLoadSuccess') {
                    this.updateTranslations();
                }
            });
    }

    ngOnDestroy(): void {
        this._stopPanelWatcher();
        this._detachPanelScrollListener();
        this.destroy$.next();
        this.destroy$.complete();
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
        const emailKantor = item?.selfupdate?.email_kantor ?? '';
        const email = emailKantor && emailKantor.includes('@') ? emailKantor : '';
        const userId = Number(item?.user_id ?? item?.id ?? 0);
        const phone = item?.selfupdate?.phone_number ?? item?.employee?.phone ?? item?.phone ?? '';
        
        return {
            id: userId,
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
                    catchError((error) => {
                        console.error('Error loading members:', error);
                        return of(null);
                    }),
                    finalize(() => { this.isLoadingAssignment = false; })
                )
                .subscribe((res) => {
                    if (!res || !res.status) {
                        console.error('Invalid response:', res);
                        this.memberList = [];
                        this._buildAssignOptions();
                        return;
                    }
                    
                    const rows = Array.isArray(res?.data) ? res.data : [];
                    const photoBase = this.hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
                    
                    // Filter for Agent (role=1) and Technical (role=2) only
                    this.memberList = rows
                        .filter((row: any) => {
                            const role = Number(row?.role ?? 0);
                            const roleName = row?.role_name || '';
                            return role === 1 || role === 2 || roleName === 'Agent' || roleName === 'Technical';
                        })
                        .map((row: any) => this._mapApiUser(row, photoBase));
                    
                    // console.log('Loaded members:', this.memberList);
                    this._buildAssignOptions();
                    if (!searchTrim) this.assignDataLoaded = true;
                });
        } else {
            let params = new HttpParams().set('per_page', '50');
            if (searchTrim) params = params.set('search', searchTrim);

            this._httpClient.get<any>(`${base}/teams`, { params })
                .pipe(
                    catchError((error) => {
                        console.error('Error loading teams:', error);
                        return of(null);
                    }),
                    finalize(() => { this.isLoadingAssignment = false; })
                )
                .subscribe((res) => {
                    if (!res || !res.status) {
                        console.error('Invalid response:', res);
                        this.teamList = [];
                        this._buildAssignOptions();
                        return;
                    }
                    
                    const rows = Array.isArray(res?.data) ? res.data : [];
                    this.teamList = rows.map((row: any) => ({
                        id: row?.id,
                        name: row?.name ?? '',
                        description: row?.description ?? '',
                        members: [],
                        status: row?.deleted_at ? 'Inactive' : 'Active',
                    } as Team));
                    
                    // console.log('Loaded teams:', this.teamList);
                    this._buildAssignOptions();
                    if (!searchTrim) this.assignDataLoaded = true;
                });
        }
    }

    private _mapApiUser(row: any, photoBase: string): User {
        const photo = row?.photo || '';
        const roleNumber = Number(row?.role ?? 0);
        const roleName = row?.role_name || '';
        
        // Map role based on role_name or role number
        let role: User['role'];
        if (roleName === 'Admin' || roleNumber === 3) {
            role = 'Admin';
        } else if (roleName === 'Technical' || roleNumber === 2) {
            role = 'Technical';
        } else if (roleName === 'Agent' || roleNumber === 1) {
            role = 'Agent';
        } else {
            role = 'User';
        }
        
        return {
            id: row?.id,
            fullName: row?.name ?? '',
            email: row?.email ?? '',
            role: role,
            status: Number(row?.status ?? 1) === 0 ? 'Inactive' : 'Active',
            department: row?.department?.name ?? row?.department_id ?? '',
            avatar: photo ? `${photoBase}/assets/img/user/${photo}` : 'assets/images/avatars/male-01.jpg',
            photo,
        };
    }

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

    getInitialOf(name: string): string {
        return (name || '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    }

    getAvatarColor(index: number): string {
        return this.avatarColors[index % this.avatarColors.length];
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
                catchError((error) => {
                    console.error('Error loading approvers:', error);
                    return of(null);
                }),
                finalize(() => { this.isLoadingApprovers = false; })
            )
            .subscribe((res) => {
                if (!res || !res.status) {
                    console.error('Invalid response:', res);
                    this.approverOptions = [];
                    return;
                }
                
                const rows = Array.isArray(res?.data) ? res.data : [];
                const photoBase = this.hrisApiUrl.replace(/\/$/, '').replace(/\/api$/, '');
                const users = rows
                    .filter((row: any) => {
                        const role = Number(row?.role ?? 0);
                        const roleName = row?.role_name || '';
                        // Filter for Admin, Agent, or Technical
                        return role === 1 || role === 2 || role === 3 || 
                               roleName === 'Admin' || roleName === 'Agent' || roleName === 'Technical';
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

    updateTranslations(): void {
        this.priorities = [
            { value: 'Low', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_LOW') },
            { value: 'Medium', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_MEDIUM') },
            { value: 'High', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_HIGH') },
            { value: 'Critical', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.PRIORITY_CRITICAL') }
        ];

        this.departments = [
            { value: 'IT', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_IT') },
            { value: 'HR', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_HR') },
            { value: 'Finance', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_FINANCE') },
            { value: 'Operations', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_OPERATIONS') },
            { value: 'Marketing', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DEPT_MARKETING') }
        ];

        this.requestTypes = [
            { value: 'New Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.TYPE_NEW') },
            { value: 'Change Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.TYPE_CHANGE') },
            { value: 'Revoke Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.TYPE_REVOKE') }
        ];

        this.accessLevels = [
            { value: 'Viewer', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_VIEWER') },
            { value: 'Standard User', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_STANDARD') },
            { value: 'Editor', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_EDITOR') },
            { value: 'Admin Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.LEVEL_ADMIN') }
        ];

        this.durationTypes = [
            { value: 'Temporary Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DURATION_TEMPORARY') },
            { value: 'Permanent Access', label: this.translocoService.translate('ACCESS_REQUESTS.FORM.DURATION_PERMANENT') }
        ];
    }

    updateAssignOptions() {
        // This method is now handled by _buildAssignOptions
        // Keep for compatibility but data comes from API
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

    onAssignTypeChange(): void {
        this.selectedAssignee = null;
        this.assignSearchQuery = '';
        this.assignDropdownOpen = false;
        this.assignDataLoaded = false;
        this.assignOptions = [];
        this.form.patchValue({ assignTo: '', assignType: this.assignType });
    }

    clearAssignee(): void {
        this.selectedAssignee = null;
        this.form.patchValue({ assignTo: '' });
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
        if (event.dataTransfer?.files) {
            this.addFiles(Array.from(event.dataTransfer.files));
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.addFiles(Array.from(input.files));
        }
    }

    addFiles(files: File[]): void {
        const validFiles = files.filter(
            (file) => file.size <= 10 * 1024 * 1024
        );
        this.uploadedFiles.push(...validFiles);
    }

    removeFile(index: number): void {
        this.uploadedFiles.splice(index, 1);
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    onSubmit(): void {
        if (this.form.valid && !this.isSubmitting) {
            if (!this.currentUser || !this.currentUser.id) {
                this._snackbar.error('User not authenticated');
                return;
            }

            this.isSubmitting = true;

            // Prepare data
            const formValue = this.form.value;
            
            // Check if we have files to upload
            if (this.uploadedFiles.length > 0) {
                // Use FormData for file upload
                const formData = new FormData();
                
                // Add all form fields
                formData.append('requester_id', this.currentUser.id);
                formData.append('full_name', formValue.fullName);
                formData.append('email', formValue.email);
                if (formValue.phone) formData.append('phone', formValue.phone);
                formData.append('department', formValue.department);
                formData.append('resource_name', formValue.resourceName);
                formData.append('request_type', formValue.requestType);
                formData.append('access_level', formValue.accessLevel);
                formData.append('reason', formValue.reason);
                formData.append('duration_type', formValue.durationType.value || formValue.durationType);
                if (formValue.startDate) formData.append('start_date', formValue.startDate);
                if (formValue.endDate) formData.append('end_date', formValue.endDate);
                formData.append('assign_type', formValue.assignType);
                if (this.selectedAssignee) {
                    if (formValue.assignType === 'member') {
                        formData.append('assign_to_user_id', this.selectedAssignee.id);
                    } else {
                        formData.append('assign_to_team_id', this.selectedAssignee.id);
                    }
                }
                
                // Map priority string to number
                const priorityMap: any = { 'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3 };
                const priorityValue = priorityMap[formValue.priority] ?? 1;
                formData.append('priority', priorityValue.toString());
                
                formData.append('notify_requester', formValue.notifyRequester ? '1' : '0');
                formData.append('require_manager_approval', formValue.requireManagerApproval ? '1' : '0');
                
                // Add files
                this.uploadedFiles.forEach((file) => {
                    formData.append('attachments[]', file, file.name);
                });

                this._accessRequestService.createAccessRequestWithFiles(formData)
                    .pipe(
                        catchError((error) => {
                            console.error('Error creating access request:', error);
                            this._snackbar.error(error?.error?.message || 'Failed to create access request');
                            return of(null);
                        }),
                        finalize(() => {
                            this.isSubmitting = false;
                        })
                    )
                    .subscribe((response) => {
                        if (response && response.status) {
                            this._snackbar.success('Access request created successfully');
                            this.router.navigate(['/access-requests/data']);
                        }
                    });
            } else {
                // No files, use JSON
                const priorityMap: any = { 'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3 };
                const priorityValue = priorityMap[formValue.priority] ?? 1;

                const payload = {
                    requester_id: this.currentUser.id,
                    full_name: formValue.fullName,
                    email: formValue.email,
                    phone: formValue.phone,
                    department: formValue.department,
                    resource_name: formValue.resourceName,
                    request_type: formValue.requestType,
                    access_level: formValue.accessLevel,
                    reason: formValue.reason,
                    duration_type: formValue.durationType.value || formValue.durationType,
                    start_date: formValue.startDate,
                    end_date: formValue.endDate,
                    assign_type: formValue.assignType,
                    assign_to_user_id: this.selectedAssignee && formValue.assignType === 'member' ? this.selectedAssignee.id : null,
                    assign_to_team_id: this.selectedAssignee && formValue.assignType === 'team' ? this.selectedAssignee.id : null,
                    priority: priorityValue,
                    notify_requester: formValue.notifyRequester,
                    require_manager_approval: formValue.requireManagerApproval,
                };

                this._accessRequestService.createAccessRequest(payload)
                    .pipe(
                        catchError((error) => {
                            console.error('Error creating access request:', error);
                            this._snackbar.error(error?.error?.message || 'Failed to create access request');
                            return of(null);
                        }),
                        finalize(() => {
                            this.isSubmitting = false;
                        })
                    )
                    .subscribe((response) => {
                        if (response && response.status) {
                            this._snackbar.success('Access request created successfully');
                            this.router.navigate(['/access-requests/data']);
                        }
                    });
            }
        } else {
            this.form.markAllAsTouched();
            this._snackbar.error('Please fill all required fields');
        }
    }

    onReset(): void {
        this.form.reset({
            durationType: this.durationTypes[0],
            priority: 'Medium',
            assignType: 'member',
            notifyRequester: false,
            requireManagerApproval: false,
        });
        this.selectedAssignee = null;
        this.uploadedFiles = [];
    }

    onCancel(): void {
        this.router.navigate(['/access-requests/data']);
    }

    backToAccessRequests(): void {
        this.router.navigate(['/access-requests/data']);
    }
}
