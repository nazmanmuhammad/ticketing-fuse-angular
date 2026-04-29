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
        'requester_id',
        'full_name',
        'email',
        'phone',
        'department',
        'resource_name',
        'request_type',
        'access_level',
        'reason',
        'duration_type',
        'start_date',
        'end_date',
        'assign_type',
        'assign_to_user_id',
        'assign_to_team_id',
        'status',
        'priority',
        'notify_requester',
        'require_manager_approval',
        'approval_required',
        'approver_ids',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'notify_requester' => 'boolean',
        'require_manager_approval' => 'boolean',
        'approval_required' => 'boolean',
        'approver_ids' => 'array',
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
     * Get assigned user (if assigned to member)
     */
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assign_to_user_id');
    }

    /**
     * Get assigned team (if assigned to team)
     */
    public function assignedTeam()
    {
        return $this->belongsTo(Team::class, 'assign_to_team_id');
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