<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use SoftDeletes, Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'commentable_id',
        'commentable_type',
        'user_id',
        'comment',
        'mentions',
        'is_internal',
        'parent_id',
    ];

    protected $casts = [
        'is_internal' => 'boolean',
        'mentions' => 'array',
    ];

    /**
     * Get the parent commentable model (Ticket, etc.)
     */
    public function commentable()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who created the comment
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get attachments for this comment
     */
    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachmentable');
    }

    /**
     * Get parent comment (for replies)
     */
    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    /**
     * Get replies to this comment (flat structure like Facebook)
     */
    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id')
            ->with(['user', 'attachments'])
            ->orderBy('created_at', 'asc'); // Oldest first like Facebook
    }

    /**
     * Get mentioned users
     */
    public function mentionedUsers()
    {
        if (!$this->mentions || !is_array($this->mentions)) {
            return collect([]);
        }
        
        return User::whereIn('id', $this->mentions)->get();
    }
}
