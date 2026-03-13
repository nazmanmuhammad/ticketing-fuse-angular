<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Team extends Model
{
    use SoftDeletes, Uuid;
    //
    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'name',
        'description',
    ];

    public function teamUsers()
    {
        return $this->hasMany(TeamUser::class);
    }
}
