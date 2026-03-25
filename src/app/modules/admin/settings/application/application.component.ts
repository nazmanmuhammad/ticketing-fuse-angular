import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { finalize } from 'rxjs';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-application-setting',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './application.component.html',
})
export class ApplicationSettingComponent implements OnInit {
    form = {
        appName: 'Ticketing Fuse',
        appTitle: 'Ticketing Fuse Admin Panel',
        logoUrl: '',
        faviconUrl: '',
    };

    logoPreview = '';
    faviconPreview = '';
    logoFile: File | null = null;
    faviconFile: File | null = null;
    isLoading = false;
    isSaving = false;

    constructor(
        private _settingsService: SettingsService,
        private _snackbarService: SnackbarService
    ) {}

    ngOnInit(): void {
        this.loadSetting();
    }

    onLogoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        this.logoFile = file;

        const reader = new FileReader();
        reader.onload = () => {
            this.logoPreview = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    }

    onFaviconSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        this.faviconFile = file;

        const reader = new FileReader();
        reader.onload = () => {
            this.faviconPreview = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    }

    loadSetting(): void {
        this.isLoading = true;
        this._settingsService
            .getApplicationSetting()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (data) => {
                    this.form.appName = data.app_name || '';
                    this.form.appTitle = data.app_title || '';
                    this.form.logoUrl = data.logo_url || '';
                    this.form.faviconUrl = data.favicon_url || '';
                },
                error: () => {
                    this._snackbarService.error('Gagal memuat application setting');
                },
            });
    }

    save(): void {
        if (this.isSaving) {
            return;
        }

        this.isSaving = true;
        this._settingsService
            .updateApplicationSetting({
                app_name: this.form.appName,
                app_title: this.form.appTitle,
                logo_url: this.form.logoUrl,
                favicon_url: this.form.faviconUrl,
                logo_file: this.logoFile,
                favicon_file: this.faviconFile,
            })
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                })
            )
            .subscribe({
                next: (data) => {
                    this.form.logoUrl = data.logo_url || '';
                    this.form.faviconUrl = data.favicon_url || '';
                    this.logoFile = null;
                    this.faviconFile = null;
                    this._snackbarService.success('Application setting berhasil disimpan');
                },
                error: () => {
                    this._snackbarService.error('Gagal menyimpan application setting');
                },
            });
    }
}
