import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy } from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import {
    MatAutocompleteModule,
    MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, of } from 'rxjs';
import { User } from '../user.types';

@Component({
    selector: 'user-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatAutocompleteModule,
        MatOptionModule,
    ],
    templateUrl: './user-dialog.component.html',
    styles: [
        `
        ::ng-deep .mat-mdc-dialog-surface {
            padding: 0 !important;
        }
        `,
    ],
})
export class UserDialogComponent implements OnDestroy {
    userForm: FormGroup;
    mode: 'create' | 'update' = 'create';

    roles = ['User', 'Agent', 'Technical', 'Admin'];
    departments: Array<{ id: string; name: string }> = [];
    isLoadingDepartments = false;
    statuses = ['Active', 'Inactive'];
    users: User[] = [];
    employeeInput: FormControl<string | null> = new FormControl('');
    filteredEmployeesList: User[] = [];
    employeeAutocompleteEnabled = false;
    isLoadingEmployees = false;
    hasMoreEmployees = true;
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
    private readonly backendApiUrl: string =
        (globalThis as any)?.__env?.API_URL ||
        (globalThis as any)?.process?.env?.API_URL ||
        (globalThis as any)?.API_URL ||
        'https://ticket-api.siglab.site/api';
    private readonly employeeApiUrl: string = this._buildEmployeeApiUrl();
    private readonly employeePhotoBaseUrl: string =
        this._buildEmployeePhotoBaseUrl();

    constructor(
        private _httpClient: HttpClient,
        private _formBuilder: FormBuilder,
        public matDialogRef: MatDialogRef<UserDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { user: User; users?: User[] }
    ) {
        this.mode = data.user ? 'update' : 'create';
        const prefilledEmployee = this._prefillEmployee(data.user);
        this.users = prefilledEmployee ? [prefilledEmployee] : [];
        this.filteredEmployeesList = this.users;
        
        // Use departmentId if available, otherwise use department (for backward compatibility)
        const departmentValue = data.user?.departmentId || data.user?.department || '';
        
        this.userForm = this._formBuilder.group({
            employee: [prefilledEmployee || null, Validators.required],
            role: [data.user?.role || 'Agent', Validators.required],
            department: [departmentValue],
            status: [data.user?.status || 'Active', Validators.required],
        });

        // Prefill input display if edit
        const emp = this.userForm.get('employee')?.value as User | null;
        if (emp) {
            this.employeeInput.setValue(`${emp.fullName} (${emp.email})`);
        }

        this.employeeInput.valueChanges.subscribe((val) => {
            const q = (val || '').toString().toLowerCase();
            this.filteredEmployeesList = this.users.filter(
                (u) =>
                    (u.fullName || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q)
            );
        });

        // Load departments from API
        this._loadDepartments();
    }

    save(): void {
        if (this.userForm.invalid) {
            return;
        }
        const value = this.userForm.value;
        const emp = value.employee as User | null;
        if (!emp) {
            return;
        }
        
        // Find department name from ID
        const selectedDept = this.departments.find(d => d.id === value.department);
        
        this.matDialogRef.close({
            fullName: emp?.fullName,
            email: emp?.email,
            employeeId: emp?.employeeId,
            hrisUserId: emp?.hrisUserId,
            // userId: emp?.userId,
            photo: emp?.photo,
            avatar: emp?.avatar,
            role: value.role,
            departmentId: value.department || null,
            department: selectedDept?.name || value.department || null,
            status: value.status,
            // Add new fields from HRIS
            phone_number: (emp as any)?.phone || (emp as any)?.phone_number || null,
            division: (emp as any)?.division || (emp as any)?.division_name || null,
            position: (emp as any)?.position || (emp as any)?.position_name || null,
        });
    }

    onEmployeeSelected(user: User): void {
        this.userForm.get('employee')?.setValue(user);
        this.employeeInput.setValue(this.employeeDisplay(user), {
            emitEvent: false,
        });
        this.employeeChanged = true;
    }

    enableEmployeeAutocomplete(trigger: MatAutocompleteTrigger): void {
        if (!this.employeeAutocompleteEnabled) {
            this.employeeAutocompleteEnabled = true;
        }
        if (!this.users.length && this.hasMoreEmployees) {
            this._loadEmployees();
        }
        this.employeeChanged = false;
        this.employeeInput.setValue('', { emitEvent: true });
        this.filteredEmployeesList = this.users;
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
                panel.scrollTop + panel.clientHeight >=
                panel.scrollHeight - threshold;
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
        if (this.employeeChanged) {
            return;
        }
        const emp = this.userForm.get('employee')?.value as User | null;
        if (emp) {
            this.employeeInput.setValue(this.employeeDisplay(emp), {
                emitEvent: false,
            });
        } else {
            this.employeeInput.setValue('', { emitEvent: false });
        }
    }

    compareUsers(o1: User, o2: User): boolean {
        return o1?.id === o2?.id;
    }

    private _prefillEmployee(user?: User): User | null {
        if (!user) return null;
        return {
            ...user,
            employeeId: user.employeeId,
            hrisUserId: user.hrisUserId,
            // userId: user.userId,
            photo: user.photo,
        };
    }

    private _loadEmployees(): void {
        if (this.isLoadingEmployees || !this.hasMoreEmployees) {
            return;
        }
        this.isLoadingEmployees = true;
        const requestedPage = this.currentEmployeePage;
        const employeePageUrl = this._buildEmployeePageUrl(requestedPage);

        this._httpClient
            .post<any>(employeePageUrl, {})
            .pipe(
                catchError(() => of(null)),
                finalize(() => {
                    this.isLoadingEmployees = false;
                })
            )
            .subscribe((response) => {
                if (!response) {
                    return;
                }

                const list = Array.isArray(response?.data) ? response.data : [];
                if (!list.length) {
                    this.hasMoreEmployees = false;
                    return;
                }

                const beforeCount = this.users.length;
                const mapped = list.map((item: any) => this._mapEmployee(item));
                this._appendEmployees(mapped);
                const appendedCount = this.users.length - beforeCount;

                const currentPage = Number(
                    response?.current_page || requestedPage
                );
                const lastPage = Number(response?.last_page || 0);
                const hasNextFromUrl = Boolean(response?.next_page_url);
                this.hasMoreEmployees =
                    (lastPage > 0 && currentPage < lastPage) ||
                    hasNextFromUrl ||
                    appendedCount > 0;
                this.currentEmployeePage = requestedPage + 1;

                const search = (this.employeeInput.value || '')
                    .toString()
                    .toLowerCase();
                this.filteredEmployeesList = this.users.filter(
                    (u) =>
                        (u.fullName || '').toLowerCase().includes(search) ||
                        (u.email || '').toLowerCase().includes(search)
                );
                this._ensureScrollableData();
            });
    }

    private _appendEmployees(newEmployees: User[]): void {
        const map = new Map<string, User>();
        this.users.forEach((employee) =>
            map.set(this._userKey(employee), employee)
        );
        newEmployees.forEach((employee) =>
            map.set(this._userKey(employee), employee)
        );
        this.users = Array.from(map.values());
    }

    private _mapEmployee(item: any): User {
        const photo = item?.employee?.photo ?? item?.photo ?? '';
        // Get email from email_kantor from HRIS API
        // Use item?.selfupdate?.email_kantor as the primary source
        const emailKantor = item?.selfupdate?.email_kantor ?? '';
        const email = emailKantor && emailKantor.includes('@') ? emailKantor : '';
        
        // Get phone number from root level or selfupdate
        const phone = item?.phone ?? item?.selfupdate?.phone ?? item?.employee?.phone ?? '';
        
        // Get division name from bagian object
        const divisionName = item?.bagian?.division_name ?? item?.division_name ?? item?.division?.name ?? '';
        
        // Get position name from position object
        const positionName = item?.position?.position_name ?? item?.position_name ?? '';
        
        return {
            id: Number(item?.employee_id ?? item?.user_id ?? item?.id ?? 0),
            employeeId: Number(item?.employee_id ?? item?.id ?? 0),
            hrisUserId: Number(item?.user_id ?? 0),
            // userId: Number(item?.user_id ?? item?.employee_id ?? 0),
            fullName:
                item?.employee_name ??
                item?.name ??
                item?.employee?.name ??
                '-',
            email: email,
            role: 'User',
            status: 'Active',
            avatar: photo
                ? `${this.employeePhotoBaseUrl}/assets/img/user/${photo}`
                : 'assets/images/avatars/male-01.jpg',
            photo,
            // Add new fields from HRIS
            phone: phone,
            phone_number: phone,
            division: divisionName,
            division_name: divisionName,
            position: positionName,
            position_name: positionName,
        } as any;
    }

    private _userKey(user: User): string {
        return String(
            user?.id ??
                user?.employeeId ??
                user?.hrisUserId ??
                // user?.userId ??
                user?.email ??
                ''
        );
    }

    private _buildEmployeeApiUrl(): string {
        const normalized = this.hrisApiUrl.replace(/\/$/, '');
        if (normalized.endsWith('/api')) {
            return `${normalized}/hris/employee`;
        }
        return `${normalized}/api/hris/employee`;
    }

    private _buildEmployeePageUrl(page: number): string {
        return `${this.employeeApiUrl}?page=${page}&company=1`;
    }

    private _buildEmployeePhotoBaseUrl(): string {
        const normalized = this.hrisApiUrl.replace(/\/$/, '');
        return normalized.replace(/\/api$/, '');
    }

    private _detachPanelScrollListener(): void {
        if (!this.panelScrollElement || !this.panelScrollHandler) {
            return;
        }
        this.panelScrollElement.removeEventListener(
            'scroll',
            this.panelScrollHandler
        );
        this.panelScrollElement = null;
        this.panelScrollHandler = null;
    }

    private _startPanelWatcher(trigger: MatAutocompleteTrigger): void {
        this._stopPanelWatcher();
        this.panelWatcher = setInterval(() => {
            const panel = trigger.autocomplete?.panel
                ?.nativeElement as HTMLElement;
            if (!panel) {
                return;
            }

            this.panelScrollElement = panel;
            const threshold = 80;
            const reachedBottom =
                panel.scrollTop + panel.clientHeight >=
                panel.scrollHeight - threshold;
            if (reachedBottom) {
                this._loadEmployees();
                return;
            }

            if (panel.scrollHeight <= panel.clientHeight + 2) {
                this._loadEmployees();
            }
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
            if (
                !this.panelScrollElement ||
                this.isLoadingEmployees ||
                !this.hasMoreEmployees
            ) {
                return;
            }

            const panel = this.panelScrollElement;
            const hasScrollbar = panel.scrollHeight > panel.clientHeight + 2;
            if (!hasScrollbar) {
                this._loadEmployees();
            }
        });
    }

    employeeDisplay = (user: User | null): string => {
        if (!user) return '';
        return `${user.fullName} (${user.email})`;
    };

    /**
     * Load departments from API
     */
    private _loadDepartments(): void {
        this.isLoadingDepartments = true;
        console.log('[UserDialog] Loading departments from:', `${this.backendApiUrl}/departments`);
        
        this._httpClient
            .get<any>(`${this.backendApiUrl}/departments?per_page=100`)
            .pipe(
                catchError((error) => {
                    console.error('[UserDialog] Error loading departments:', error);
                    return of({ status: false, data: [] });
                }),
                finalize(() => {
                    this.isLoadingDepartments = false;
                    console.log('[UserDialog] Departments loaded:', this.departments);
                })
            )
            .subscribe((response) => {
                console.log('[UserDialog] Departments API response:', response);
                if (response && response.status && response.data) {
                    this.departments = response.data.map((dept: any) => ({
                        id: dept.id,
                        name: dept.name,
                    }));
                    console.log('[UserDialog] Mapped departments:', this.departments);
                }
            });
    }

    ngOnDestroy(): void {
        this._stopPanelWatcher();
        this._detachPanelScrollListener();
    }
}
