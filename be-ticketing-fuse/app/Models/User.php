<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model
{
    use SoftDeletes, Uuid;
    use HasFactory;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'hris_user_id',
        'role',
        'department_id',
        'status',
        'last_login_at',
    ];

    public function teams()
    {
        return $this->hasMany(TeamUser::class);
    }
}
