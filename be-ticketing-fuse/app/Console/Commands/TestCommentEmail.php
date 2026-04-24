<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\SendCommentFeedbackNotification;
use App\Models\Comment;

class TestCommentEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:comment-email {comment_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test comment feedback email notification';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $commentId = $this->argument('comment_id');
        
        $comment = Comment::find($commentId);
        if (!$comment) {
            $this->error("Comment with ID {$commentId} not found");
            return 1;
        }

        $this->info("Testing comment feedback email for comment: {$commentId}");
        
        try {
            SendCommentFeedbackNotification::dispatch($commentId);
            $this->info("Email job dispatched successfully!");
        } catch (\Exception $e) {
            $this->error("Failed to dispatch email job: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}