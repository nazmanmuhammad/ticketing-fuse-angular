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
        'name',
        'email',
        'role',
        'department_id',
        'status',
        'photo',
        'last_login_at',
    ];

    protected $appends = [
        'role_name'
    ];

    public function teams()
    {
        return $this->hasMany(TeamUser::class);
    }

    public function getRoleNameAttribute()
    {
        return $this->role == 0 ? 'User' : 'Admin';
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
