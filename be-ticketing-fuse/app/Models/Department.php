<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
use SoftDeletes, Uuid;
    //
    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'name',
        'description',
        'status',
        'head_id'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function head()
    {
        return $this->belongsTo(User::class, 'head_id');
    }
}
