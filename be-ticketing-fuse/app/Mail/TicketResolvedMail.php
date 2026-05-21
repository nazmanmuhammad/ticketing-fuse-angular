<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketResolvedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientName;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Ticket $ticket,
        ?string $recipientName = null
    ) {
        $this->recipientName = $recipientName ?? $ticket->name ?? 'User';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ticket #' . $this->ticket->ticket_number . ' Has Been Resolved',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $appSettings = \App\Models\AppSetting::first();
        
        return new Content(
            view: 'emails.ticket-resolved',
            with: [
                'ticket' => $this->ticket,
                'recipientName' => $this->recipientName,
                'appSettings' => $appSettings,
                'logoPath' => public_path('images/logo/helpdesk-logo-white.png'),
                'sigLogoPath' => public_path('images/logo/logo-sig.svg'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
