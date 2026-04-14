<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalItem extends Model
{
    use Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'approval_id',
        'user_id',
        'level',
        'status',
        'notes',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'level' => 'integer',
    ];

    /**
     * Get the parent approval
     */
    public function approval(): BelongsTo
    {
        return $this->belongsTo(Approval::class);
    }

    /**
     * Get the user (approver)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get pending items
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved items
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get rejected items
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope to get items by level
     */
    public function scopeByLevel($query, int $level)
    {
        return $query->where('level', $level);
    }

    /**
     * Check if item is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if item is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if item is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Check if user can approve (based on level logic)
     */
    public function canApprove(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        // Get all items in this approval
        $approval = $this->approval;
        
        // Check if previous levels are completed
        $previousLevels = $approval->items()
            ->where('level', '<', $this->level)
            ->get()
            ->groupBy('level');

        foreach ($previousLevels as $level => $items) {
            // All items in previous level must be approved
            $approvedCount = $items->where('status', 'approved')->count();
            if ($approvedCount !== $items->count()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Approve the item
     */
    public function approve(?string $notes = null): bool
    {
        $result = $this->update([
            'status' => 'approved',
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        // Update parent approval status
        if ($result) {
            $this->approval->updateStatus();
        }

        return $result;
    }

    /**
     * Reject the item
     */
    public function reject(?string $notes = null): bool
    {
        $result = $this->update([
            'status' => 'rejected',
            'notes' => $notes,
            'approved_at' => now(),
        ]);

        // Update parent approval status
        if ($result) {
            $this->approval->updateStatus();
        }

        return $result;
    }
}
