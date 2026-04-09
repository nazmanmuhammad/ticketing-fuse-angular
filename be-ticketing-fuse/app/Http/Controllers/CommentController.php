<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Ticket;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * Store a new comment
     */
    public function store(Request $request)
    {
        $request->validate([
            'commentable_type' => 'required|string',
            'commentable_id' => 'required|string',
            'comment' => 'required|string',
            'is_internal' => 'nullable|in:0,1,true,false',
            'parent_id' => 'nullable|exists:comments,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
        ]);

        // Map commentable_type to full class name
        $commentableTypeMap = [
            'ticket' => Ticket::class,
            'Ticket' => Ticket::class,
        ];

        $commentableType = $commentableTypeMap[$request->commentable_type] ?? $request->commentable_type;

        // Convert is_internal to boolean
        $isInternal = filter_var($request->is_internal, FILTER_VALIDATE_BOOLEAN);

        // If this is a reply to a reply, make it a reply to the parent comment instead (Facebook style)
        $parentId = $request->parent_id;
        if ($parentId) {
            $parentComment = Comment::find($parentId);
            if ($parentComment && $parentComment->parent_id) {
                // This is a reply to a reply, so make it a reply to the original comment
                $parentId = $parentComment->parent_id;
            }
        }

        // Create comment
        $comment = Comment::create([
            'commentable_type' => $commentableType,
            'commentable_id' => $request->commentable_id,
            'user_id' => $request->user_id,
            'comment' => $request->comment,
            'mentions' => $request->mentions ?? [],
            'is_internal' => $isInternal,
            'parent_id' => $parentId,
        ]);

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('public/comments/' . date('Y/m/d'));
                
                Attachment::create([
                    'attachmentable_id' => $comment->id,
                    'attachmentable_type' => Comment::class,
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'mime' => $file->extension(),
                    'user_id' => $request->user_id,
                    'visible' => true,
                ]);
            }
        }

        // Load relationships
        $comment->load(['user', 'attachments']);

        return response()->json([
            'status' => true,
            'message' => 'Comment created successfully',
            'data' => $comment,
        ], 201);
    }

    /**
     * Get comments for a specific commentable
     */
    public function index(Request $request)
    {
        $request->validate([
            'commentable_type' => 'required|string',
            'commentable_id' => 'required|string',
        ]);

        // Map commentable_type to full class name
        $commentableTypeMap = [
            'ticket' => Ticket::class,
            'Ticket' => Ticket::class,
        ];

        $commentableType = $commentableTypeMap[$request->commentable_type] ?? $request->commentable_type;

        $comments = Comment::where('commentable_type', $commentableType)
            ->where('commentable_id', $request->commentable_id)
            ->whereNull('parent_id') // Only top-level comments
            ->with(['user', 'attachments', 'replies.user', 'replies.attachments'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Comments retrieved successfully',
            'data' => $comments,
        ]);
    }

    /**
     * Update a comment
     */
    public function update(Request $request, string $id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json([
                'status' => false,
                'message' => 'Comment not found',
            ], 404);
        }

        $request->validate([
            'comment' => 'required|string',
            'is_internal' => 'nullable|in:0,1,true,false',
        ]);

        // Convert is_internal to boolean
        $isInternal = $request->has('is_internal') 
            ? filter_var($request->is_internal, FILTER_VALIDATE_BOOLEAN)
            : $comment->is_internal;

        $comment->update([
            'comment' => $request->comment,
            'is_internal' => $isInternal,
        ]);

        $comment->load(['user', 'attachments', 'replies']);

        return response()->json([
            'status' => true,
            'message' => 'Comment updated successfully',
            'data' => $comment,
        ]);
    }

    /**
     * Delete a comment
     */
    public function destroy(string $id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json([
                'status' => false,
                'message' => 'Comment not found',
            ], 404);
        }

        $comment->delete();

        return response()->json([
            'status' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }
}
