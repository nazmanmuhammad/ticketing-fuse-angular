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
        const isAgent = normalizedRoleName === 'agent';
        if (!isAgent) {
            return navigation;
        }

        return {
            compact: this._removeNavigationItemById(
                navigation.compact,
                'master_data'
            ),
            default: this._removeNavigationItemById(
                navigation.default,
                'master_data'
            ),
            futuristic: this._removeNavigationItemById(
                navigation.futuristic,
                'master_data'
            ),
            horizontal: this._removeNavigationItemById(
                navigation.horizontal,
                'master_data'
            ),
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
}
