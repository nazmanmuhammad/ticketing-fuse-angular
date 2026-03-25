<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function getApplicationSetting()
    {
        $setting = $this->getSingleton();

        return response()->json([
            'status' => true,
            'message' => 'Application setting berhasil diambil',
            'data' => [
                'app_name' => $setting->app_name,
                'app_title' => $setting->app_title,
                'logo_url' => $this->resolveAssetUrl($setting->logo_url, $setting->logo_path),
                'favicon_url' => $this->resolveAssetUrl($setting->favicon_url, $setting->favicon_path),
            ],
        ]);
    }

    public function updateApplicationSetting(Request $request)
    {
        $payload = $request->validate([
            'app_name' => 'nullable|string|max:255',
            'app_title' => 'nullable|string|max:255',
            'logo_url' => 'nullable|string|max:2048',
            'favicon_url' => 'nullable|string|max:2048',
            'logo_file' => 'nullable|image|max:2048',
            'favicon_file' => 'nullable|image|max:1024',
        ]);

        $setting = $this->getSingleton();

        $setting->app_name = $payload['app_name'] ?? null;
        $setting->app_title = $payload['app_title'] ?? null;
        $setting->logo_url = $payload['logo_url'] ?? null;
        $setting->favicon_url = $payload['favicon_url'] ?? null;

        if ($request->hasFile('logo_file')) {
            if ($setting->logo_path) {
                Storage::disk('public')->delete($setting->logo_path);
            }
            $setting->logo_path = $request->file('logo_file')->store('settings', 'public');
            $setting->logo_url = null;
        }

        if ($request->hasFile('favicon_file')) {
            if ($setting->favicon_path) {
                Storage::disk('public')->delete($setting->favicon_path);
            }
            $setting->favicon_path = $request->file('favicon_file')->store('settings', 'public');
            $setting->favicon_url = null;
        }

        $setting->save();

        return response()->json([
            'status' => true,
            'message' => 'Application setting berhasil diperbarui',
            'data' => [
                'app_name' => $setting->app_name,
                'app_title' => $setting->app_title,
                'logo_url' => $this->resolveAssetUrl($setting->logo_url, $setting->logo_path),
                'favicon_url' => $this->resolveAssetUrl($setting->favicon_url, $setting->favicon_path),
            ],
        ]);
    }

    public function getSmtpSetting()
    {
        $setting = $this->getSingleton();

        return response()->json([
            'status' => true,
            'message' => 'SMTP setting berhasil diambil',
            'data' => [
                'host' => $setting->smtp_host,
                'port' => $setting->smtp_port,
                'encryption' => $setting->smtp_encryption,
                'username' => $setting->smtp_username,
                'password' => $setting->smtp_password,
                'from_name' => $setting->smtp_from_name,
                'from_email' => $setting->smtp_from_email,
            ],
        ]);
    }

    public function updateSmtpSetting(Request $request)
    {
        $payload = $request->validate([
            'host' => 'nullable|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'encryption' => 'nullable|in:none,ssl,tls',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'from_name' => 'nullable|string|max:255',
            'from_email' => 'nullable|email|max:255',
        ]);

        $setting = $this->getSingleton();

        $setting->smtp_host = $payload['host'] ?? null;
        $setting->smtp_port = $payload['port'] ?? null;
        $setting->smtp_encryption = $payload['encryption'] ?? null;
        $setting->smtp_username = $payload['username'] ?? null;
        $setting->smtp_from_name = $payload['from_name'] ?? null;
        $setting->smtp_from_email = $payload['from_email'] ?? null;

        if (array_key_exists('password', $payload)) {
            $setting->smtp_password = $payload['password'] ?: $setting->smtp_password;
        }

        $setting->save();

        return response()->json([
            'status' => true,
            'message' => 'SMTP setting berhasil diperbarui',
            'data' => [
                'host' => $setting->smtp_host,
                'port' => $setting->smtp_port,
                'encryption' => $setting->smtp_encryption,
                'username' => $setting->smtp_username,
                'password' => $setting->smtp_password,
                'from_name' => $setting->smtp_from_name,
                'from_email' => $setting->smtp_from_email,
            ],
        ]);
    }

    private function getSingleton(): AppSetting
    {
        return AppSetting::query()->first() ?? AppSetting::query()->create([]);
    }

    private function resolveAssetUrl(?string $directUrl, ?string $path): ?string
    {
        if (!empty($directUrl)) {
            return $directUrl;
        }

        if (empty($path)) {
            return null;
        }

        return Storage::url($path);
    }
}
