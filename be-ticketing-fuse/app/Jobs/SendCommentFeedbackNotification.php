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
            $recipients = collect();
            
            // Add requester
            if ($ticketData->requester && $ticketData->requester->email) {
                $recipients->push([
                    'email' => $ticketData->requester->email,
                    'name' => $ticketData->requester->name
                ]);
            }
            
            // Add pic_technical
            if ($ticketData->pic_technical && $ticketData->pic_technical->email) {
                $recipients->push([
                    'email' => $ticketData->pic_technical->email,
                    'name' => $ticketData->pic_technical->name
                ]);
            }
            
            // Add pic_helpdesk
            if ($ticketData->pic_helpdesk && $ticketData->pic_helpdesk->email) {
                $recipients->push([
                    'email' => $ticketData->pic_helpdesk->email,
                    'name' => $ticketData->pic_helpdesk->name
                ]);
            }

            // Remove duplicates based on email
            $recipients = $recipients->unique('email');

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

            // Send email to all recipients
            foreach ($recipients as $recipient) {
                Mail::to($recipient['email'], $recipient['name'])
                    ->send(new CommentFeedbackMail(
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