<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Approval extends Model
{
    use Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'approvable_id',
        'approvable_type',
        'status',
        'requested_by',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    /**
     * Get the parent approvable model (Ticket, AccessRequest, etc.)
     */
    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who requested the approval
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get all approval items
     */
    public function items(): HasMany
    {
        return $this->hasMany(ApprovalItem::class);
    }

    /**
     * Scope to get pending approvals
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved approvals
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get rejected approvals
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Check if approval is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if approval is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if approval is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Check if approval is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Update approval status based on items
     */
    public function updateStatus(): void
    {
        $items = $this->items;
        $totalItems = $items->count();
        
        if ($totalItems === 0) {
            return;
        }

        $approvedCount = $items->where('status', 'approved')->count();
        $rejectedCount = $items->where('status', 'rejected')->count();

        // If any item is rejected, mark approval as rejected
        if ($rejectedCount > 0) {
            $this->update([
                'status' => 'rejected',
                'completed_at' => now(),
            ]);
            return;
        }

        // If all items are approved, mark approval as approved
        if ($approvedCount === $totalItems) {
            $this->update([
                'status' => 'approved',
                'completed_at' => now(),
            ]);
            return;
        }

        // Otherwise, keep as pending
        $this->update(['status' => 'pending']);
    }

    /**
     * Cancel the approval
     */
    public function cancel(?string $notes = null): bool
    {
        return $this->update([
            'status' => 'cancelled',
            'notes' => $notes,
            'completed_at' => now(),
        ]);
    }
}
