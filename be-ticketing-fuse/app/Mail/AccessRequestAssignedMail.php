<?php

namespace App\Mail;

use App\Models\AccessRequest;
use App\Models\AppSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccessRequestAssignedMail extends Mailable
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
        
        return $this->subject('Access Request Assigned - ' . $this->accessRequest->request_number)
                    ->view('emails.access-request-assigned')
                    ->with([
                        'accessRequest' => $this->accessRequest,
                        'appSettings' => $this->appSettings,
                    ]);
    }
}
