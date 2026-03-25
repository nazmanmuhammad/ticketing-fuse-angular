<?php

namespace App\Providers;

use App\Models\AppSetting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            if (!Schema::hasTable('app_settings')) {
                return;
            }

            $setting = AppSetting::query()->first();

            if (!$setting) {
                return;
            }

            $smtp = config('mail.mailers.smtp', []);
            $from = config('mail.from', []);
            $scheme = match ($setting->smtp_encryption) {
                'ssl' => 'smtps',
                'tls', 'none', null, '' => 'smtp',
                default => $smtp['scheme'] ?? 'smtp',
            };

            config([
                'mail.mailers.smtp.host' => $setting->smtp_host ?: ($smtp['host'] ?? null),
                'mail.mailers.smtp.port' => $setting->smtp_port ?: ($smtp['port'] ?? null),
                'mail.mailers.smtp.username' => $setting->smtp_username ?: ($smtp['username'] ?? null),
                'mail.mailers.smtp.password' => $setting->smtp_password ?: ($smtp['password'] ?? null),
                'mail.mailers.smtp.scheme' => $scheme,
                'mail.from.address' => $setting->smtp_from_email ?: ($from['address'] ?? null),
                'mail.from.name' => $setting->smtp_from_name ?: ($from['name'] ?? null),
            ]);
        } catch (Throwable $e) {
            // Keep default env-based mail config when database is unavailable.
        }
    }
}
