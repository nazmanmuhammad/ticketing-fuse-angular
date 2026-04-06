<?php

namespace App\Jobs;

use App\Mail\TicketCreatedMail;
use App\Mail\TicketAssignedMail;
use App\Models\Ticket;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendTicketNotification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Ticket $ticket,
        public string $type, // 'created' or 'assigned'
        public ?string $recipientEmail = null
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->type === 'created') {
            // Send to requester - use 'email' field from tickets table
            if ($this->ticket->email && filter_var($this->ticket->email, FILTER_VALIDATE_EMAIL)) {
                Mail::to($this->ticket->email)
                    ->send(new TicketCreatedMail($this->ticket));
            }
        } elseif ($this->type === 'assigned' && $this->recipientEmail) {
            // Send to assigned technical
            if (filter_var($this->recipientEmail, FILTER_VALIDATE_EMAIL)) {
                Mail::to($this->recipientEmail)
                    ->send(new TicketAssignedMail($this->ticket));
            }
        }
    }
}
