<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketTeamAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;
    public $teamMember;

    /**
     * Create a new message instance.
     */
    public function __construct(Ticket $ticket, User $teamMember)
    {
        $this->ticket = $ticket;
        $this->teamMember = $teamMember;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Ticket Assigned to Your Team - ' . $this->ticket->ticket_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket-team-assigned',
            with: [
                'ticket' => $this->ticket,
                'teamMember' => $this->teamMember,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
