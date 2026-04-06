import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);
    private _requestCounts = {
        tickets: 12,
        access: 8,
        change: 5,
        job: 3,
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
                            const filteredNavigation =
                                this._filterNavigationByRole(
                                    navigation,
                                    user?.role_name
                                );
                            this._navigation.next(filteredNavigation);
                        })
                    )
            )
        );
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
