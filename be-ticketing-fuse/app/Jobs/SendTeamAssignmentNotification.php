<?php

namespace App\Jobs;

use App\Mail\TicketTeamAssignedMail;
use App\Models\Ticket;
use App\Models\TeamUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendTeamAssignmentNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $ticket;

    /**
     * Create a new job instance.
     */
    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Get all team members
            $teamMembers = TeamUser::where('team_id', $this->ticket->team_id)
                ->with('user')
                ->get();

            Log::info('Sending team assignment notification', [
                'ticket_id' => $this->ticket->id,
                'team_id' => $this->ticket->team_id,
                'team_members_count' => $teamMembers->count()
            ]);

            // Send email to each team member
            foreach ($teamMembers as $teamUser) {
                if ($teamUser->user && $teamUser->user->email) {
                    try {
                        Mail::to($teamUser->user->email)
                            ->send(new TicketTeamAssignedMail($this->ticket, $teamUser->user));
                        
                        Log::info('Team assignment email sent', [
                            'ticket_id' => $this->ticket->id,
                            'recipient' => $teamUser->user->email
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to send team assignment email', [
                            'ticket_id' => $this->ticket->id,
                            'recipient' => $teamUser->user->email,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to send team assignment notifications', [
                'ticket_id' => $this->ticket->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
