<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;

class AccessRequestApprovalItem extends Model
{
    use Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'access_request_approval_id',
        'user_id',
        'level',
        'status',
        'notes',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    /**
     * Get the approval
     */
    public function approval()
    {
        return $this->belongsTo(AccessRequestApproval::class, 'access_request_approval_id');
    }

    /**
     * Get the approver user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}