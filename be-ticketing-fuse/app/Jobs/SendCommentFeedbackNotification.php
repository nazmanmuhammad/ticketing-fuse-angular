<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use App\Mail\CommentFeedbackMail;
use App\Models\Ticket;
use App\Models\Comment;
use App\Models\User;

class SendCommentFeedbackNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $commentId;

    /**
     * Create a new job instance.
     */
    public function __construct($commentId)
    {
        $this->commentId = $commentId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Get comment with relations
            $comment = Comment::with(['user', 'commentable'])->find($this->commentId);
            
            if (!$comment || !$comment->commentable) {
                return;
            }

            // Skip if comment is internal
            if ($comment->is_internal) {
                return;
            }

            $ticket = $comment->commentable;
            
            // Get ticket with all relations
            $ticketData = Ticket::with([
                'requester', 
                'pic_technical', 
                'pic_helpdesk',
                'comments' => function($query) {
                    // Only get non-internal comments for email
                    $query->where('is_internal', false)
                          ->with(['user', 'attachments'])
                          ->orderBy('created_at', 'asc');
                }
            ])->find($ticket->id);

            if (!$ticketData) {
                return;
            }

            // Collect all involved users (no duplicates)
            $requesterEmail = null;
            $requesterName = null;
            $otherRecipients = collect();
            
            // Add requester as primary recipient (TO)
            if ($ticketData->requester && $ticketData->requester->email) {
                $requesterEmail = $ticketData->requester->email;
                $requesterName = $ticketData->requester->name;
            }
            
            // Add pic_technical to other recipients (CC/BCC)
            if ($ticketData->pic_technical && $ticketData->pic_technical->email) {
                // Don't add if same as requester
                if ($ticketData->pic_technical->email !== $requesterEmail) {
                    $otherRecipients->push([
                        'email' => $ticketData->pic_technical->email,
                        'name' => $ticketData->pic_technical->name
                    ]);
                }
            }
            
            // Add pic_helpdesk to other recipients (CC/BCC)
            if ($ticketData->pic_helpdesk && $ticketData->pic_helpdesk->email) {
                // Don't add if same as requester
                if ($ticketData->pic_helpdesk->email !== $requesterEmail) {
                    $otherRecipients->push([
                        'email' => $ticketData->pic_helpdesk->email,
                        'name' => $ticketData->pic_helpdesk->name
                    ]);
                }
            }

            // Remove duplicates based on email from other recipients
            $otherRecipients = $otherRecipients->unique('email');

            // Prepare ticket data for email
            $ticketArray = [
                'id' => $ticketData->id,
                'ticket_number' => $ticketData->ticket_number,
                'subject_issue' => $ticketData->subject_issue,
                'issue_detail' => $ticketData->issue_detail,
                'status' => $ticketData->status,
                'priority' => $ticketData->priority,
                'created_at' => $ticketData->created_at,
                'requester' => $ticketData->requester ? [
                    'name' => $ticketData->requester->name,
                    'email' => $ticketData->requester->email
                ] : null,
                'pic_technical' => $ticketData->pic_technical ? [
                    'name' => $ticketData->pic_technical->name,
                    'email' => $ticketData->pic_technical->email
                ] : null,
                'pic_helpdesk' => $ticketData->pic_helpdesk ? [
                    'name' => $ticketData->pic_helpdesk->name,
                    'email' => $ticketData->pic_helpdesk->email
                ] : null
            ];

            // Prepare comment data
            $commentArray = [
                'id' => $comment->id,
                'comment' => $comment->comment,
                'created_at' => $comment->created_at,
                'attachments' => $comment->attachments ? $comment->attachments->map(function($attachment) {
                    return [
                        'name' => $attachment->name,
                        'size' => $attachment->size,
                        'mime' => $attachment->mime
                    ];
                })->toArray() : []
            ];

            // Prepare commenter data
            $commenterArray = $comment->user ? [
                'name' => $comment->user->name,
                'email' => $comment->user->email
            ] : [
                'name' => 'Unknown User',
                'email' => ''
            ];

            // Prepare all comments for email (non-internal only)
            $allCommentsArray = $ticketData->comments->map(function($c) {
                return [
                    'id' => $c->id,
                    'comment' => $c->comment,
                    'created_at' => $c->created_at,
                    'user' => $c->user ? [
                        'name' => $c->user->name,
                        'email' => $c->user->email
                    ] : null,
                    'attachments' => $c->attachments ? $c->attachments->map(function($attachment) {
                        return [
                            'name' => $attachment->name,
                            'size' => $attachment->size,
                            'mime' => $attachment->mime
                        ];
                    })->toArray() : []
                ];
            })->toArray();

            // Send email to requester (TO) and others (BCC)
            // Only send if requester email exists
            if ($requesterEmail) {
                // Get other recipients emails for BCC
                $bccRecipients = $otherRecipients->map(function($recipient) {
                    return $recipient['email'];
                })->toArray();

                // Create mail instance to requester
                $mail = Mail::to($requesterEmail, $requesterName);
                
                // Add BCC recipients (PIC Technical & PIC Helpdesk) if any
                if (!empty($bccRecipients)) {
                    $mail->bcc($bccRecipients);
                }
                
                // Send the email
                $mail->send(new CommentFeedbackMail(
                    $ticketArray,
                    $commentArray,
                    $commenterArray,
                    $allCommentsArray
                ));
            }

        } catch (\Exception $e) {
            \Log::error('Failed to send comment feedback notification: ' . $e->getMessage());
            throw $e;
        }
    }
}