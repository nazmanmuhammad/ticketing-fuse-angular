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

class TicketCreatedMail extends Mailable
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
            subject: 'Ticket Created Successfully - #' . $this->ticket->ticket_number,
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

        \Log::info($appUrl);
        
        return new Content(
            view: 'emails.ticket-created',
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
