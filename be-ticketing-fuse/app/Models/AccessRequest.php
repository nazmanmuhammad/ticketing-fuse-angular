<?php

namespace App\Models;

use App\Traits\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccessRequest extends Model
{
    use SoftDeletes, Uuid;

    public $incrementing = false;
    protected $keyType = "uuid";

    protected $fillable = [
        'request_number',
        'requester_type',
        'requester_id',
        'name', // Changed from full_name
        'email',
        'phone_number', // Changed from phone
        'department_id',
        'extension_number',
        'resource_name',
        'request_type', // Changed to string (free text)
        'access_level', // Changed to string (free text)
        'reason',
        'duration_type',
        'start_date',
        'end_date',
        'assign_status', // Changed from assign_type
        'team_id', // Changed from assign_to_team_id
        'pic_technical_id', // Changed from assign_to_user_id
        'pic_helpdesk_id', // Added
        'status',
        'priority',
        'response', // Added
        'internal_note', // Added
        'mark_internal', // Added
        'approval_required',
        'close_on_response', // Added
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approval_required' => 'boolean',
        'close_on_response' => 'boolean',
        'mark_internal' => 'boolean',
        'status' => 'integer',
        'priority' => 'integer',
    ];

    protected $appends = ['status_name'];

    /**
     * Boot method to generate request number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->request_number)) {
                $model->request_number = self::generateRequestNumber();
            }
        });
    }

    /**
     * Generate unique request number with retry mechanism
     */
    public static function generateRequestNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        $maxRetries = 5;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            // Get the highest request number for this month
            $lastNumber = self::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->where('request_number', 'like', 'AR-' . $year . $month . '-%')
                ->max('request_number');

            if ($lastNumber && preg_match('/AR-' . $year . $month . '-(\d+)/', $lastNumber, $matches)) {
                $number = intval($matches[1]) + 1;
            } else {
                $number = 1;
            }

            $requestNumber = sprintf('AR-%s%s-%04d', $year, $month, $number);

            // Check if this number already exists
            $exists = self::where('request_number', $requestNumber)->exists();
            
            if (!$exists) {
                return $requestNumber;
            }

            $attempt++;
            usleep(100000); // Wait 100ms before retry
        }

        // Fallback: use timestamp to ensure uniqueness
        return sprintf('AR-%s%s-%04d-%s', $year, $month, $number, substr(microtime(true) * 10000, -4));
    }

    /**
     * Get status name
     */
    public function getStatusNameAttribute(): string
    {
        $statusMap = [
            0 => 'Pending',
            1 => 'Approved',
            2 => 'Rejected',
            3 => 'Provisioned',
        ];

        return $statusMap[$this->status] ?? 'Pending';
    }

    /**
     * Get requester user
     */
    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Get PIC Technical (assigned user)
     */
    public function picTechnical()
    {
        return $this->belongsTo(User::class, 'pic_technical_id');
    }

    /**
     * Get PIC Helpdesk
     */
    public function picHelpdesk()
    {
        return $this->belongsTo(User::class, 'pic_helpdesk_id');
    }

    /**
     * Get assigned team
     */
    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    /**
     * Get department
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get assigned user (alias for picTechnical - for backward compatibility)
     */
    public function assignedUser()
    {
        return $this->picTechnical();
    }

    /**
     * Get assigned team (alias for team - for backward compatibility)
     */
    public function assignedTeam()
    {
        return $this->team();
    }

    /**
     * Get access request tracks (activity log)
     */
    public function tracks()
    {
        return $this->hasMany(AccessRequestTrack::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get approval (polymorphic relationship)
     */
    public function approval()
    {
        return $this->morphOne(Approval::class, 'approvable');
    }

    /**
     * Get attachments
     */
    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachmentable');
    }

    /**
     * Get comments
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable')
            ->whereNull('parent_id')
            ->with(['user', 'attachments', 'replies.user', 'replies.attachments'])
            ->orderBy('created_at', 'desc');
    }
}