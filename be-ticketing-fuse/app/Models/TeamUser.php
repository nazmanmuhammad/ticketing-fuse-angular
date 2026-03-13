<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeamUser extends Model
{
    use SoftDeletes, Uuid;
    //
    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'team_id',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
