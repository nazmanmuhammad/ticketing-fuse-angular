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

class TicketAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientName;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Ticket $ticket,
        public bool $isReassignment = false,
        ?string $recipientName = null
    ) {
        $this->recipientName = $recipientName ?? $ticket->pic_technical->name ?? 'User';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isReassignment 
            ? 'Ticket #' . $this->ticket->ticket_number . ' Has Been Reassigned to You'
            : 'You Have Been Assigned to Ticket #' . $this->ticket->ticket_number;
            
        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $appSettings = \App\Models\AppSetting::first();
        $appUrl = config('app.url', 'http://localhost');
        $hrisPhotoUrl = config('app.hris_photo_url', 'http://localhost');
        
        return new Content(
            view: 'emails.ticket-assigned',
            with: [
                'ticket' => $this->ticket,
                'recipientName' => $this->recipientName,
                'appSettings' => $appSettings,
                'logoUrl' => $appUrl . '/logo/helpdesk-logo-white.png',
                'sigLogoUrl' => $appUrl . '/logo/logo-sig.png',
                'hrisPhotoUrl' => $hrisPhotoUrl,
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
