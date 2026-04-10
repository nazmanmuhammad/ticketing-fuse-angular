<?php

namespace App\Jobs;

use App\Mail\TicketResolvedMail;
use App\Models\Ticket;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendTicketResolvedNotification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Ticket $ticket
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Send to requester - use 'email' field from tickets table
        if ($this->ticket->email && filter_var($this->ticket->email, FILTER_VALIDATE_EMAIL)) {
            Mail::to($this->ticket->email)
                ->send(new TicketResolvedMail($this->ticket));
        }
    }
}
