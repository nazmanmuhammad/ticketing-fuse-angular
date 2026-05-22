<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CommentFeedbackMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;
    public $comment;
    public $commenter;
    public $allComments;
    public string $recipientName;

    /**
     * Create a new message instance.
     */
    public function __construct($ticket, $comment, $commenter, $allComments = [], $recipientName = 'User')
    {
        $this->ticket = $ticket;
        $this->comment = $comment;
        $this->commenter = $commenter;
        $this->allComments = $allComments;
        $this->recipientName = $recipientName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Feedback #' . $this->ticket['ticket_number'],
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
            view: 'emails.comment-feedback',
            with: [
                'ticket' => $this->ticket,
                'comment' => $this->comment,
                'commenter' => $this->commenter,
                'allComments' => $this->allComments,
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
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}