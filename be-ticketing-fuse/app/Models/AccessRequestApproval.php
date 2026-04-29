<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;

class AccessRequestApproval extends Model
{
    use Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'access_request_id',
        'level',
    ];

    /**
     * Get the access request
     */
    public function accessRequest()
    {
        return $this->belongsTo(AccessRequest::class);
    }

    /**
     * Get approval items
     */
    public function items()
    {
        return $this->hasMany(AccessRequestApprovalItem::class, 'access_request_approval_id')
            ->with('user')
            ->orderBy('level', 'asc');
    }
}