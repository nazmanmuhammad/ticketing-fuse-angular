<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketTrack extends Model
{
    use SoftDeletes, Uuid;
    //
    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'ticket_id',
        'user_id',
        'action',
        'description',
    ];
}
