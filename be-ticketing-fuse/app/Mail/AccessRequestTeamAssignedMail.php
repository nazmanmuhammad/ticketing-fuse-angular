<?php

namespace App\Mail;

use App\Models\AccessRequest;
use App\Models\User;
use App\Models\AppSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccessRequestTeamAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $accessRequest;
    public $teamMember;
    public $appSettings;
    public string $recipientName;

    /**
     * Create a new message instance.
     */
    public function __construct(AccessRequest $accessRequest, User $teamMember)
    {
        $this->accessRequest = $accessRequest;
        $this->teamMember = $teamMember;
        $this->recipientName = $teamMember->name ?? 'Team Member';
        $this->appSettings = AppSetting::first();
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $appName = $this->appSettings->app_name ?? 'WorkDesk';
        $logoArchiveUrl = config('app.logo_from_archive_url', 'https://archive.sigconnect.co.id/nazman');
        $hrisPhotoUrl = config('app.hris_photo_url', 'http://localhost');
        
        return $this->subject('New Access Request Assigned to Your Team - ' . $this->accessRequest->request_number)
                    ->view('emails.access-request-team-assigned')
                    ->with([
                        'accessRequest' => $this->accessRequest,
                        'teamMember' => $this->teamMember,
                        'recipientName' => $this->recipientName,
                        'appSettings' => $this->appSettings,
                        'logoUrl' => $logoArchiveUrl . '/helpdesk-logo-white.png',
                        'sigLogoUrl' => $logoArchiveUrl . '/logo-sig.png',
                        'hrisPhotoUrl' => $hrisPhotoUrl,
                    ]);
    }
}
