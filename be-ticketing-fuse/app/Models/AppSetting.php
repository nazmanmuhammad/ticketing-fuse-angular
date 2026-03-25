<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    use HasFactory, Uuid;

    public $incrementing = false;
    protected $keyType = 'uuid';

    protected $fillable = [
        'app_name',
        'app_title',
        'logo_url',
        'logo_path',
        'favicon_url',
        'favicon_path',
        'smtp_host',
        'smtp_port',
        'smtp_encryption',
        'smtp_username',
        'smtp_password',
        'smtp_from_name',
        'smtp_from_email',
    ];
}
