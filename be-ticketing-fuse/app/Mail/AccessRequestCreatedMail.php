<?php

namespace App\Mail;

use App\Models\AccessRequest;
use App\Models\AppSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccessRequestCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $accessRequest;
    public $appSettings;

    /**
     * Create a new message instance.
     */
    public function __construct(AccessRequest $accessRequest)
    {
        $this->accessRequest = $accessRequest;
        $this->appSettings = AppSetting::first();
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $appName = $this->appSettings->app_name ?? 'WorkDesk';
        $logoArchiveUrl = config('app.logo_from_archive_url', 'https://archive.sigconnect.co.id/nazman');
        
        return $this->subject('Access Request Created - ' . $this->accessRequest->request_number)
                    ->view('emails.access-request-created')
                    ->with([
                        'accessRequest' => $this->accessRequest,
                        'appSettings' => $this->appSettings,
                        'logoUrl' => $logoArchiveUrl . '/helpdesk-logo-white.png',
                        'sigLogoUrl' => $logoArchiveUrl . '/logo-sig.png',
                    ]);
    }
}
