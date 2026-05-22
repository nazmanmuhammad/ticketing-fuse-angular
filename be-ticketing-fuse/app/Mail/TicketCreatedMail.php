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
        $logoArchiveUrl = config('app.logo_from_archive_url', 'https://archive.sigconnect.co.id/nazman');
        $hrisPhotoUrl = config('app.hris_photo_url', 'http://localhost');

        \Log::info($logoArchiveUrl);
        
        return new Content(
            view: 'emails.ticket-created',
            with: [
                'ticket' => $this->ticket,
                'recipientName' => $this->recipientName,
                'appSettings' => $appSettings,
                'logoUrl' => $logoArchiveUrl . '/helpdesk-logo-white.png',
                'sigLogoUrl' => $logoArchiveUrl . '/logo-sig.png',
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
