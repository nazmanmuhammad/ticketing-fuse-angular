<?php

namespace App\Models;

use App\TicketStatusEnum;
use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes, Uuid;
    //
    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'requester_id',
        'name',
        'email',
        'phone_number',
        'extension_number',
        'ticket_source',
        'department_id',
        'help_topic',
        'subject_issue',
        'issue_detail',
        'priority',
        'assign_status',
        'pic_technical_id',
        'pic_helpdesk_id',
        'status',
    ];

    protected $casts = [
        'status' => 'integer'
    ];

    protected $appends = ['status_name'];

    public function getStatusNameAttribute()
    {
        return TicketStatusEnum::from($this->status)->label();
    }
}
