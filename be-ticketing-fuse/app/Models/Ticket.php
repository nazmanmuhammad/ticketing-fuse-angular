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
        'ticket_number',
        'requester_type',
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
        'team_id',
        'pic_technical_id',
        'pic_helpdesk_id',
        'status',
    ];

    protected $casts = [
        'status' => 'integer'
    ];

    protected $appends = ['status_name'];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id', 'hris_user_id');
    }

    public function pic_technical()
    {
        return $this->belongsTo(User::class, 'pic_technical_id');
    }

    public function pic_helpdesk()
    {
        return $this->belongsTo(User::class, 'pic_helpdesk_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function getStatusNameAttribute()
    {
        return TicketStatusEnum::from($this->status)->label();
    }

    public function ticketTrack()
    {
        return $this->hasMany(TicketTrack::class);
    }

    /**
     * Generate unique ticket number
     * Format: TN00001, TN00002, etc.
     */
    public static function generateTicketNumber(): string
    {
        // Get the last ticket number
        $lastTicket = self::withTrashed()
            ->whereNotNull('ticket_number')
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$lastTicket || !$lastTicket->ticket_number) {
            return 'TN00001';
        }

        // Extract number from last ticket (e.g., TN00001 -> 1)
        $lastNumber = (int) substr($lastTicket->ticket_number, 2);
        $newNumber = $lastNumber + 1;

        // Format with leading zeros (5 digits)
        return 'TN' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
}
