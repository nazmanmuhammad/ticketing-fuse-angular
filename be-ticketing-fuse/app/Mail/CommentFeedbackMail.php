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

    /**
     * Create a new message instance.
     */
    public function __construct($ticket, $comment, $commenter, $allComments = [])
    {
        $this->ticket = $ticket;
        $this->comment = $comment;
        $this->commenter = $commenter;
        $this->allComments = $allComments;
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
        return new Content(
            view: 'emails.comment-feedback',
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