import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { TicketService } from 'app/modules/admin/tickets/ticket.service';
import { Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _ticketService = inject(TicketService);
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);
    private _requestCounts = {
        tickets: 0,
        access: 0,
        change: 0,
        job: 0,
    };

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        return this._userService.user$.pipe(
            take(1),
            switchMap((user: User) =>
                this._httpClient
                    .get<Navigation>('api/common/navigation')
                    .pipe(
                        tap((navigation) => {
                            // Deep clone to avoid reference issues
                            const clonedNavigation = JSON.parse(JSON.stringify(navigation));
                            const filteredNavigation =
                                this._filterNavigationByRole(
                                    clonedNavigation,
                                    user?.role_name
                                );
                            this._navigation.next(filteredNavigation);
                            
                            // Load ticket counts after navigation is set
                            this.loadTicketCounts(user);
                        })
                    )
            )
        );
    }
    
    /**
     * Load ticket counts from API
     */
    loadTicketCounts(user: User): void {
        if (!user) {
            console.log('[NavigationService] No user provided');
            return;
        }
        
        const params: any = {
            role: user.role_name?.toLowerCase()
        };
        
        // Add role-specific params
        if (params.role === 'agent') {
            params.user_id = user.id;
        } else if (params.role === 'technical') {
            params.user_id = user.id;
        } else if (params.role === 'user') {
            params.requester_id = user.id; // Use me-validation ID, not hris_user_id
        }
        
        console.log('[NavigationService] Loading ticket counts with params:', params);
        
        this._ticketService.getCounts(params).subscribe({
            next: (response: any) => {
                console.log('[NavigationService] Ticket counts response:', response);
                
                if (response.status && typeof response.data === 'number') {
                    // Update tickets count with pending count
                    this._requestCounts.tickets = response.data;
                    console.log('[NavigationService] Updated ticket count to:', response.data);
                    
                    // Get current navigation and update badge
                    this._navigation.pipe(take(1)).subscribe((currentNav) => {
                        if (currentNav) {
                            console.log('[NavigationService] Current navigation before update:', currentNav);
                            
                            // Create a deep clone to trigger change detection
                            const updatedNav = {
                                default: this._updateTicketBadgeInArray([...currentNav.default], response.data),
                                compact: this._updateTicketBadgeInArray([...currentNav.compact], response.data),
                                futuristic: this._updateTicketBadgeInArray([...currentNav.futuristic], response.data),
                                horizontal: this._updateTicketBadgeInArray([...currentNav.horizontal], response.data),
                            };
                            
                            console.log('[NavigationService] Updated navigation:', updatedNav);
                            
                            // Emit updated navigation
                            this._navigation.next(updatedNav);
                        }
                    });
                } else {
                    console.warn('[NavigationService] Invalid response format:', response);
                }
            },
            error: (error) => {
                console.error('[NavigationService] Error loading ticket counts:', error);
            }
        });
    }
    
    /**
     * Update ticket badge in navigation items array (returns new array)
     */
    private _updateTicketBadgeInArray(items: FuseNavigationItem[], count: number): FuseNavigationItem[] {
        if (!items) return items;
        
        return items.map(item => {
            const updatedItem = { ...item };
            
            if (updatedItem.id === 'tickets' && updatedItem.badge) {
                updatedItem.badge = {
                    ...updatedItem.badge,
                    title: count.toString()
                };
                console.log('[NavigationService] Updated tickets badge to:', count);
            }
            
            // Also check for user_requests.tickets for user role
            if (updatedItem.id === 'user_requests' && updatedItem.children) {
                updatedItem.children = updatedItem.children.map(child => {
                    const updatedChild = { ...child };
                    if (updatedChild.id === 'user_requests.tickets' && updatedChild.badge) {
                        updatedChild.badge = {
                            ...updatedChild.badge,
                            title: count.toString()
                        };
                        console.log('[NavigationService] Updated user_requests.tickets badge to:', count);
                    }
                    return updatedChild;
                });
                
                // Update parent badge total
                if (updatedItem.badge) {
                    const totalCount = this._requestCounts.tickets + 
                                     this._requestCounts.access + 
                                     this._requestCounts.change + 
                                     this._requestCounts.job;
                    updatedItem.badge = {
                        ...updatedItem.badge,
                        title: totalCount.toString()
                    };
                }
            }
            
            // Recursively update children
            if (updatedItem.children) {
                updatedItem.children = this._updateTicketBadgeInArray(updatedItem.children, count);
            }
            
            return updatedItem;
        });
    }
    
    /**
     * Refresh ticket counts
     */
    refreshTicketCounts(): void {
        this._userService.user$.pipe(take(1)).subscribe((user) => {
            if (user) {
                this.loadTicketCounts(user);
            }
        });
    }

    private _filterNavigationByRole(
        navigation: Navigation,
        roleName?: string
    ): Navigation {
        const normalizedRoleName = (roleName || '').toLowerCase();
        const isUser = normalizedRoleName === 'user';
        const shouldHideMasterDataAndSettings =
            normalizedRoleName === 'agent' ||
            normalizedRoleName === 'technical';

        if (isUser) {
            return {
                compact: this._getUserDefaultNavigation(navigation.compact),
                default: this._getUserDefaultNavigation(navigation.default),
                futuristic: this._getUserDefaultNavigation(
                    navigation.futuristic
                ),
                horizontal: this._getUserDefaultNavigation(
                    navigation.horizontal
                ),
            };
        }

        if (!shouldHideMasterDataAndSettings) {
            return navigation;
        }

        return {
            compact: this._removeNavigationItemsByIds(
                navigation.compact,
                ['master_data', 'settings']
            ),
            default: this._removeNavigationItemsByIds(
                navigation.default,
                ['master_data', 'settings']
            ),
            futuristic: this._removeNavigationItemsByIds(
                navigation.futuristic,
                ['master_data', 'settings']
            ),
            horizontal: this._removeNavigationItemsByIds(
                navigation.horizontal,
                ['master_data', 'settings']
            ),
        };
    }

    private _getUserDefaultNavigation(
        items: FuseNavigationItem[]
    ): FuseNavigationItem[] {
        const dashboardMenu = items.find((item) => item.id === 'dashboard');

        return [
            ...(dashboardMenu ? [dashboardMenu] : []),
            this._buildUserRequestMenu(),
        ];
    }

    private _buildUserRequestMenu(): FuseNavigationItem {
        const totalCount = this._requestCounts.tickets + this._requestCounts.access + this._requestCounts.change + this._requestCounts.job;
        
        return {
            id: 'user_requests',
            title: 'NAVIGATION.REQUESTS',
            translate: 'NAVIGATION.REQUESTS',
            type: 'aside',
            icon: 'heroicons_outline:clipboard-document-list',
            badge: {
                title: `${totalCount}`,
                classes: 'bg-red-500 text-white',
            },
            children: [
                {
                    id: 'user_requests.tickets',
                    title: 'NAVIGATION.TICKETS',
                    translate: 'NAVIGATION.TICKETS',
                    type: 'basic',
                    icon: 'heroicons_outline:ticket',
                    link: '/user/tickets',
                    badge: {
                        title: `${this._requestCounts.tickets}`,
                        classes: 'bg-red-500 text-white',
                    },
                },
                {
                    id: 'user_requests.access',
                    title: 'NAVIGATION.ACCESS_REQUEST',
                    translate: 'NAVIGATION.ACCESS_REQUEST',
                    type: 'basic',
                    icon: 'heroicons_outline:key',
                    link: '/user/access-requests',
                    badge: {
                        title: `${this._requestCounts.access}`,
                        classes: 'bg-red-500 text-white',
                    },
                },
                {
                    id: 'user_requests.change',
                    title: 'NAVIGATION.CHANGE_REQUEST',
                    translate: 'NAVIGATION.CHANGE_REQUEST',
                    type: 'basic',
                    icon: 'heroicons_outline:arrow-path-rounded-square',
                    link: '/user/change-requests',
                    badge: {
                        title: `${this._requestCounts.change}`,
                        classes: 'bg-red-500 text-white',
                    },
                },
                {
                    id: 'user_requests.job',
                    title: 'NAVIGATION.JOB_REQUEST',
                    translate: 'NAVIGATION.JOB_REQUEST',
                    type: 'basic',
                    icon: 'heroicons_outline:user-plus',
                    link: '/user/job-requests',
                    badge: {
                        title: `${this._requestCounts.job}`,
                        classes: 'bg-red-500 text-white',
                    },
                },
            ],
        };
    }

    private _removeNavigationItemById(
        items: FuseNavigationItem[],
        removeId: string
    ): FuseNavigationItem[] {
        return items
            .filter((item) => item.id !== removeId)
            .map((item) => ({
                ...item,
                children: item.children
                    ? this._removeNavigationItemById(item.children, removeId)
                    : item.children,
            }));
    }

    private _removeNavigationItemsByIds(
        items: FuseNavigationItem[],
        removeIds: string[]
    ): FuseNavigationItem[] {
        return removeIds.reduce(
            (currentItems, removeId) =>
                this._removeNavigationItemById(currentItems, removeId),
            items
        );
    }
}
