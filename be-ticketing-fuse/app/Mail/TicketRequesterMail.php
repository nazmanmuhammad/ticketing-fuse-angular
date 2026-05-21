<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Ticket;
use App\Models\AppSetting;

class TicketRequesterMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;
    public $recipientName;
    public $appSettings;

    /**
     * Create a new message instance.
     */
    public function __construct(Ticket $ticket, string $recipientName)
    {
        $this->ticket = $ticket;
        $this->recipientName = $recipientName;
        $this->appSettings = AppSetting::first();
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $appName = $this->appSettings->app_name ?? 'Helpdesk';
        
        return new Envelope(
            subject: "[{$appName}] Ticket #{$this->ticket->ticket_number} - Created Successfully",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $appUrl = config('app.url', 'http://localhost');
        
        return new Content(
            view: 'emails.ticket-requester',
            with: [
                'ticket' => $this->ticket,
                'recipientName' => $this->recipientName,
                'appSettings' => $this->appSettings,
                'logoUrl' => $appUrl . '/logo/helpdesk-logo-white.png',
                'sigLogoUrl' => $appUrl . '/logo/logo-sig.png',
            ]
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
