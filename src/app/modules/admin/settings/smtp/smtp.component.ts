import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from 'app/core/services/snackbar.service';
import { finalize } from 'rxjs';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-smtp-setting',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './smtp.component.html',
})
export class SmtpSettingComponent implements OnInit {
    form = {
        host: '',
        port: 587,
        encryption: 'tls' as 'none' | 'ssl' | 'tls',
        username: '',
        password: '',
        fromName: '',
        fromEmail: '',
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
            .getSmtpSetting()
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (data) => {
                    this.form.host = data.host || '';
                    this.form.port = Number(data.port ?? 587) || 587;
                    this.form.encryption = data.encryption || 'tls';
                    this.form.username = data.username || '';
                    this.form.password = data.password || '';
                    this.form.fromName = data.from_name || '';
                    this.form.fromEmail = data.from_email || '';
                },
                error: () => {
                    this._snackbarService.error('Gagal memuat SMTP setting');
                },
            });
    }

    save(): void {
        if (this.isSaving) {
            return;
        }

        this.isSaving = true;
        this._settingsService
            .updateSmtpSetting({
                host: this.form.host,
                port: this.form.port,
                encryption: this.form.encryption,
                username: this.form.username,
                password: this.form.password,
                from_name: this.form.fromName,
                from_email: this.form.fromEmail,
            })
            .pipe(
                finalize(() => {
                    this.isSaving = false;
                })
            )
            .subscribe({
                next: () => {
                    this._snackbarService.success('SMTP setting berhasil disimpan');
                },
                error: () => {
                    this._snackbarService.error('Gagal menyimpan SMTP setting');
                },
            });
    }
}
