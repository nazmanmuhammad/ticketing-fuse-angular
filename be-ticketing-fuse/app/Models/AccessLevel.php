<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessLevel extends Model
{
    use HasFactory, Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'request_type_id',
        'name',
        'description',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    /**
     * Get the request type that owns the access level.
     */
    public function requestType(): BelongsTo
    {
        return $this->belongsTo(RequestType::class);
    }
}
