import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { finalize } from 'rxjs';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-whatsapp-setting',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './whatsapp.component.html',
})
export class WhatsappSettingComponent implements OnInit {
    form = {
        url: '',
        key: '',
        footer: '',
    };

    isLoading = false;
    isSaving = false;

    constructor(
        private _settingsService: SettingsService,
        private _snackbarService: SnackbarService
    ) {}

    ngOnInit(): void {
        this.loadSetting();
    }

    loadSetting(): void {
        this.isLoading = true;
        this._settingsService
            .getWhatsappSetting()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (data) => {
                    this.form.url = data.url || '';
                    this.form.key = data.key || '';
                    this.form.footer = data.footer || '';
                },
                error: () => {
                    this._snackbarService.error('Gagal memuat WhatsApp setting');
                },
            });
    }

    save(): void {
        if (this.isSaving) {
            return;
        }

        this.isSaving = true;
        this._settingsService
            .updateWhatsappSetting({
                url: this.form.url,
                key: this.form.key,
                footer: this.form.footer,
            })
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                })
            )
            .subscribe({
                next: () => {
                    this._snackbarService.success('WhatsApp setting berhasil disimpan');
                },
                error: () => {
                    this._snackbarService.error('Gagal menyimpan WhatsApp setting');
                },
            });
    }
}
