<?php

namespace App\Jobs;

use App\Mail\AccessRequestCreatedMail;
use App\Mail\AccessRequestAssignedMail;
use App\Mail\AccessRequestTeamAssignedMail;
use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendAccessRequestNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $accessRequestId;

    /**
     * Create a new job instance.
     */
    public function __construct($accessRequestId)
    {
        $this->accessRequestId = $accessRequestId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $accessRequest = AccessRequest::with([
                'requester',
                'picTechnical',
                'picHelpdesk',
                'team.users',
                'department'
            ])->find($this->accessRequestId);

            if (!$accessRequest) {
                Log::warning('Access request not found for notification', ['id' => $this->accessRequestId]);
                return;
            }

            // 1. Send email to requester
            if ($accessRequest->email) {
                Log::info('Sending access request created email to requester', [
                    'access_request_id' => $accessRequest->id,
                    'requester_email' => $accessRequest->email
                ]);
                
                Mail::to($accessRequest->email)->send(new AccessRequestCreatedMail($accessRequest));
            }

            // 2. Send email to PIC Technical if assigned
            if ($accessRequest->pic_technical_id && $accessRequest->picTechnical) {
                Log::info('Sending access request assigned email to PIC Technical', [
                    'access_request_id' => $accessRequest->id,
                    'pic_technical_email' => $accessRequest->picTechnical->email
                ]);
                
                Mail::to($accessRequest->picTechnical->email)->send(new AccessRequestAssignedMail($accessRequest));
            }

            // 3. Send email to all team members if team is assigned
            if ($accessRequest->team_id && $accessRequest->team) {
                $teamMembers = $accessRequest->team->users;
                
                if ($teamMembers->count() > 0) {
                    Log::info('Sending access request team assigned email', [
                        'access_request_id' => $accessRequest->id,
                        'team_id' => $accessRequest->team_id,
                        'team_members_count' => $teamMembers->count()
                    ]);
                    
                    foreach ($teamMembers as $member) {
                        if ($member->email) {
                            Mail::to($member->email)->send(new AccessRequestTeamAssignedMail($accessRequest));
                        }
                    }
                }
            }

            Log::info('Access request notifications sent successfully', ['access_request_id' => $accessRequest->id]);

        } catch (\Exception $e) {
            Log::error('Failed to send access request notification', [
                'access_request_id' => $this->accessRequestId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }
}
