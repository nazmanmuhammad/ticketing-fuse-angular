<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;

class AccessRequestTrack extends Model
{
    use Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'access_request_id',
        'user_id',
        'action',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Get the access request
     */
    public function accessRequest()
    {
        return $this->belongsTo(AccessRequest::class);
    }

    /**
     * Get the user who performed the action
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}