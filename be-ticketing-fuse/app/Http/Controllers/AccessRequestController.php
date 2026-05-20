<?php

namespace App\Http\Controllers;

use App\Models\AccessRequest;
use App\Models\AccessRequestTrack;
use App\Models\Attachment;
use App\Models\User;
use App\UserRoleEnum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccessRequestController extends Controller
{
    /**
     * Get all access requests with filters
     */
    public function index(Request $request)
    {
        $query = AccessRequest::with([
            'requester',
            'picTechnical',
            'picHelpdesk',
            'team',
            'approval.items.user',
            'department'
        ]);

        // Filter by search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('resource_name', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by requester
        if ($request->has('requester_id') && $request->requester_id) {
            $query->where('requester_id', $request->requester_id);
        }

        // Filter by assigned user
        if ($request->has('assigned_to') && $request->assigned_to) {
            $query->where(function ($q) use ($request) {
                $q->where('pic_technical_id', $request->assigned_to)
                  ->orWhere('team_id', $request->assigned_to);
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 10);
        $accessRequests = $query->paginate($perPage);

        return response()->json([
            'status' => true,
            'message' => 'Access requests retrieved successfully',
            'data' => $accessRequests->items(),
            'meta' => [
                'current_page' => $accessRequests->currentPage(),
                'last_page' => $accessRequests->lastPage(),
                'per_page' => $accessRequests->perPage(),
                'total' => $accessRequests->total(),
            ],
        ]);
    }

    /**
     * Get single access request
     */
    public function show(string $id)
    {
        $accessRequest = AccessRequest::with([
            'requester',
            'picTechnical',
            'picHelpdesk',
            'team',
            'tracks.user',
            'approval.items.user',
            'attachments',
            'comments.user',
            'comments.attachments',
            'comments.replies.user',
            'comments.replies.attachments',
            'department'
        ])->find($id);

        if (!$accessRequest) {
            return response()->json([
                'status' => false,
                'message' => 'Access request not found',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => 'Access request retrieved successfully',
            'data' => $accessRequest,
        ]);
    }

    /**
     * Create new access request
     */
    public function store(Request $request)
    {
        $request->validate([
            'requester_type' => 'nullable|in:select_employee,by_input',
            'requester_id' => 'nullable|integer',
            'requester_photo' => 'nullable|string',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone_number' => 'nullable|string|max:50',
            'extension_number' => 'nullable|string|max:20',
            'department_id' => 'required|exists:departments,id',
            'resource_name' => 'required|string|max:255',
            'request_type' => 'required|string|max:255',
            'access_level' => 'required|string|max:255',
            'reason' => 'required|string',
            'duration_type' => 'required|in:Temporary Access,Permanent Access',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'assign_status' => 'nullable|in:member,team',
            'pic_technical_id' => 'nullable|exists:users,id',
            'team_id' => 'nullable|exists:teams,id',
            'priority' => 'nullable|integer|min:0|max:3',
            'approval_required' => 'nullable|in:0,1,true,false',
            'approver_ids' => 'nullable|json',
            'created_by' => 'required|exists:users,id', 
        ]);

        DB::beginTransaction();
        try {
            // Handle requester user
            $requesterUser = null;
            if ($request->requester_type === 'select_employee' && $request->requester_id) {
                // Check if user already exists by hris_user_id or email
                $requesterUser = User::withTrashed()->where(function($query) use ($request) {
                    $query->where('hris_user_id', $request->requester_id)
                          ->orWhere('email', $request->email);
                })->first();

                if (!$requesterUser) {
                    // Only create if user doesn't exist
                    $requesterUser = User::create([
                        'hris_user_id' => $request->requester_id,
                        'name' => $request->full_name,
                        'email' => $request->email,
                        'photo' => $request->requester_photo ?? null,
                        'role' => UserRoleEnum::USER->value,
                        'status' => 1, // active
                    ]);
                } elseif ($requesterUser->trashed()) {
                    // Restore if soft deleted
                    $requesterUser->restore();
                }
            } else {
                // For by_input mode, use the provided requester_id or current user
                $requesterUser = User::find($request->requester_id ?? auth()->id());
            }

            if (!$requesterUser) {
                throw new \Exception('Requester user not found or could not be created');
            }

            // Create access request
            $accessRequest = AccessRequest::create([
                'requester_id' => $requesterUser->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'department_id' => $request->department_id,
                'resource_name' => $request->resource_name,
                'request_type' => $request->request_type,
                'access_level' => $request->access_level,
                'reason' => $request->reason,
                'duration_type' => $request->duration_type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'assign_status' => $request->assign_status ?? 'member',
                'pic_technical_id' => $request->pic_technical_id,
                'team_id' => $request->team_id,
                'status' => 0, // Pending
                'priority' => $request->priority,
                'approval_required' => filter_var($request->approval_required, FILTER_VALIDATE_BOOLEAN),
            ]);

            // Get user who is creating this access request (logged in user from request)
            $creatorUserId = $request->created_by;
            $creatorUser = User::find($creatorUserId);
            $creatorName = $creatorUser ? $creatorUser->name : 'Unknown';

            // Create activity track
            AccessRequestTrack::create([
                'access_request_id' => $accessRequest->id,
                'user_id' => $creatorUserId,
                'action' => 'created',
                'description' => 'Access request created by ' . $creatorName,
            ]);

            // Handle approvals if required
            if ($accessRequest->approval_required && $accessRequest->approver_ids) {
                $this->createApprovals($accessRequest, $accessRequest->approver_ids);
            }

            // Handle file attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('public/access-requests/' . date('Y/m/d'));
                    
                    Attachment::create([
                        'attachmentable_id' => $accessRequest->id,
                        'attachmentable_type' => AccessRequest::class,
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'mime' => $file->extension(),
                        'user_id' => $creatorUserId,
                        'visible' => true,
                    ]);
                }
            }

            DB::commit();

            // Load relationships
            $accessRequest->load([
                'requester',
                'picTechnical',
                'team',
                'tracks.user',
                'approval.items.user',
                'attachments',
                'department'
            ]);

            // Dispatch email notification job
            \App\Jobs\SendAccessRequestNotification::dispatch($accessRequest->id);

            return response()->json([
                'status' => true,
                'message' => 'Access request created successfully',
                'data' => $accessRequest,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to create access request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update access request
     */
    public function update(Request $request, string $id)
    {
        $accessRequest = AccessRequest::find($id);

        if (!$accessRequest) {
            return response()->json([
                'status' => false,
                'message' => 'Access request not found',
            ], 404);
        }

        $request->validate([
            'requester_type' => 'nullable|in:select_employee,by_input',
            'requester_id' => 'nullable|integer',
            'requester_photo' => 'nullable|string',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone_number' => 'nullable|string|max:50',
            'extension_number' => 'nullable|string|max:20',
            'department_id' => 'sometimes|exists:departments,id',
            'resource_name' => 'sometimes|string|max:255',
            'request_type' => 'sometimes|in:New Access,Change Access,Revoke Access',
            'access_level' => 'sometimes|in:Viewer,Standard User,Editor,Admin Access',
            'reason' => 'sometimes|string',
            'duration_type' => 'sometimes|in:Temporary Access,Permanent Access',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'pic_technical_id' => 'nullable|exists:users,id',
            'team_id' => 'nullable|exists:teams,id',
            'priority' => 'nullable|integer|min:0|max:3',
            'status' => 'sometimes|integer|min:0|max:2',
            'updated_by' => 'required|exists:users,id', // User performing the update
        ]);

        DB::beginTransaction();
        try {
            $oldStatus = $accessRequest->status;
            
            // Handle requester user update if requester info is being changed
            if ($request->has('requester_type') && $request->requester_type === 'select_employee' && $request->has('requester_id')) {
                // Check if user already exists by hris_user_id or email
                $requesterUser = User::withTrashed()->where(function($query) use ($request) {
                    $query->where('hris_user_id', $request->requester_id)
                          ->orWhere('email', $request->email);
                })->first();

                if (!$requesterUser) {
                    // Only create if user doesn't exist
                    $requesterUser = User::create([
                        'hris_user_id' => $request->requester_id,
                        'name' => $request->full_name,
                        'email' => $request->email,
                        'photo' => $request->requester_photo ?? null,
                        'role' => UserRoleEnum::USER->value,
                        'status' => 1, // active
                    ]);
                } elseif ($requesterUser->trashed()) {
                    // Restore if soft deleted
                    $requesterUser->restore();
                }

                // Update the requester_id in the request data
                $request->merge(['requester_id' => $requesterUser->id]);
            }
            
            // Update access request
            $accessRequest->update($request->except(['updated_by', 'approver_ids', 'approval_required', 'requester_type', 'requester_photo']));

            // Get user for activity track
            $updaterUser = User::find($request->updated_by);
            $updaterName = $updaterUser ? $updaterUser->name : 'Unknown';

            // Create activity track
            $action = 'updated';
            $description = 'Access request updated by ' . $updaterName;

            if ($request->has('status') && $request->status != $oldStatus) {
                $statusMap = [
                    0 => 'pending',
                    1 => 'approved',
                    2 => 'rejected',
                ];
                $action = $statusMap[$request->status] ?? 'updated';
                $description = 'Access request ' . $action . ' by ' . $updaterName;
            }

            AccessRequestTrack::create([
                'access_request_id' => $accessRequest->id,
                'user_id' => $request->updated_by,
                'action' => $action,
                'description' => $description,
            ]);

            DB::commit();

            // Load relationships
            $accessRequest->load([
                'requester',
                'picTechnical',
                'team',
                'tracks.user',
                'approval.items.user',
                'attachments',
                'department'
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Access request updated successfully',
                'data' => $accessRequest,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to update access request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete access request
     */
    public function destroy(string $id)
    {
        $accessRequest = AccessRequest::find($id);

        if (!$accessRequest) {
            return response()->json([
                'status' => false,
                'message' => 'Access request not found',
            ], 404);
        }

        $accessRequest->delete();

        return response()->json([
            'status' => true,
            'message' => 'Access request deleted successfully',
        ]);
    }

    /**
     * Create approvals for access request (using shared approvals table)
     */
    private function createApprovals(AccessRequest $accessRequest, array $approverIds)
    {
        // Get the requested_by user ID
        $requestedByUserId = null;
        if ($accessRequest->requester_id) {
            $requestedByUserId = $accessRequest->requester_id;
        }
        
        if (!$requestedByUserId) {
            \Log::warning('Cannot create approval: requestedByUserId is null for access request', [
                'access_request_id' => $accessRequest->id
            ]);
            return;
        }
        
        \Log::info('Creating approval for access request', [
            'access_request_id' => $accessRequest->id,
            'requested_by' => $requestedByUserId,
            'approver_ids' => $approverIds
        ]);
        
        // Create approval (parent) using shared approvals table
        $approval = \App\Models\Approval::create([
            'approvable_id' => $accessRequest->id,
            'approvable_type' => \App\Models\AccessRequest::class,
            'status' => 'pending',
            'requested_by' => $requestedByUserId,
        ]);

        \Log::info('Approval created', ['approval_id' => $approval->id]);

        // Create approval items (children)
        $approvalItems = [];
        foreach ($approverIds as $approver) {
            // Support both old format (just ID) and new format (object with user_id and level)
            if (is_array($approver)) {
                $userId = $approver['user_id'] ?? null;
                $level = $approver['level'] ?? 1;
            } else {
                $userId = $approver;
                $level = 1;
            }
            
            if ($userId) {
                $approvalItems[] = [
                    'approval_id' => $approval->id,
                    'user_id' => $userId,
                    'level' => $level,
                    'status' => 'pending',
                ];
            }
        }
        
        \Log::info('Approval items to create', ['items' => $approvalItems]);
        
        if (count($approvalItems) > 0) {
            $approval->items()->createMany($approvalItems);
            \Log::info('Approval items created successfully');
        }
    }

    /**
     * Get access request statistics for dashboard
     */
    public function statistics(Request $request)
    {
        $query = AccessRequest::query();

        // Apply role-based filtering
        if ($request->role === 'agent' || $request->role === 'technical') {
            $query->where(function($q) use ($request) {
                $q->where('pic_technical_id', $request->user_id)
                  ->orWhere('team_id', $request->team_id);
            });
        } elseif ($request->role === 'user') {
            $query->where('requester_id', $request->requester_id);
        }

        // Get filter parameters (default to current month/year)
        $currentMonth = $request->month ?? date('m');
        $currentYear = $request->year ?? date('Y');
        $lastMonth = $currentMonth == 1 ? 12 : $currentMonth - 1;
        $lastMonthYear = $currentMonth == 1 ? $currentYear - 1 : $currentYear;

        // Helper function to calculate percentage change
        $calculateChange = function($current, $previous) {
            if ($previous == 0) {
                return $current > 0 ? '+100' : '0';
            }
            $change = (($current - $previous) / $previous) * 100;
            return ($change >= 0 ? '+' : '') . number_format($change, 1);
        };

        // Get counts by status - Current Month
        $newToday = (clone $query)->where('status', 0) // Pending
            ->whereDate('created_at', today())
            ->count();

        $pendingRequests = (clone $query)->where('status', 0)->count(); // Pending

        $approvedRequests = (clone $query)->where('status', 1) // Approved
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        $rejectedRequests = (clone $query)->where('status', 2) // Rejected
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        $provisionedRequests = (clone $query)->where('status', 3) // Provisioned
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        // Get counts for LAST MONTH for comparison
        $approvedLastMonth = (clone $query)->where('status', 1)
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->count();

        $rejectedLastMonth = (clone $query)->where('status', 2)
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->count();

        $provisionedLastMonth = (clone $query)->where('status', 3)
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->count();

        // Count requests by priority - filtered by month/year
        $priorityStats = [
            'critical' => (clone $query)->where('priority', 3)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'high' => (clone $query)->where('priority', 2)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'medium' => (clone $query)->where('priority', 1)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'low' => (clone $query)->where('priority', 0)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
        ];

        // Count requests by type - Current Month
        $typeStats = [
            'new_access' => (clone $query)->where('request_type', 'New Access')
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'change_access' => (clone $query)->where('request_type', 'Change Access')
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'revoke_access' => (clone $query)->where('request_type', 'Revoke Access')
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
        ];

        // Count created requests this month
        $createdThisMonth = (clone $query)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();

        // Count created requests last month
        $createdLastMonth = (clone $query)
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->count();

        // Count total requests (all time)
        $totalRequests = (clone $query)->count();

        // Get trends data for the selected year (12 months)
        $trendsData = $this->getAccessRequestTrends($query, $currentYear);

        // Get recent requests (last 10)
        $recentRequests = (clone $query)
            ->with(['requester', 'picTechnical', 'picHelpdesk', 'team'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($request) {
                $assignedInfo = null;
                if ($request->pic_technical_id && $request->picTechnical) {
                    $assignedInfo = [
                        'type' => 'member',
                        'name' => $request->picTechnical->name,
                        'email' => $request->picTechnical->email,
                    ];
                } elseif ($request->team_id && $request->team) {
                    $assignedInfo = [
                        'type' => 'team',
                        'name' => $request->team->name,
                        'description' => $request->team->description ?? '',
                    ];
                }
                
                return [
                    'id' => $request->id,
                    'request_number' => $request->request_number,
                    'resource_name' => $request->resource_name,
                    'requester' => $request->requester ? [
                        'name' => $request->requester->name,
                        'email' => $request->requester->email,
                    ] : [
                        'name' => $request->name,
                        'email' => $request->email,
                    ],
                    'assigned' => $assignedInfo,
                    'pic_technical' => $request->picTechnical ? [
                        'id' => $request->picTechnical->id,
                        'name' => $request->picTechnical->name,
                        'email' => $request->picTechnical->email,
                    ] : null,
                    'pic_helpdesk' => $request->picHelpdesk ? [
                        'id' => $request->picHelpdesk->id,
                        'name' => $request->picHelpdesk->name,
                        'email' => $request->picHelpdesk->email,
                    ] : null,
                    'team' => $request->team ? [
                        'id' => $request->team->id,
                        'name' => $request->team->name,
                    ] : null,
                    'status' => $request->status,
                    'status_name' => $request->status_name,
                    'priority' => $request->priority,
                    'created_at' => $request->created_at->toISOString(),
                ];
            });

        return response()->json([
            'status' => true,
            'message' => 'Access request statistics retrieved successfully',
            'data' => [
                'total' => $totalRequests,
                'new_today' => $newToday,
                'pending' => $pendingRequests,
                'approved' => $approvedRequests,
                'rejected' => $rejectedRequests,
                'provisioned' => $provisionedRequests,
                'created_this_month' => $createdThisMonth,
                'priority' => $priorityStats,
                'type' => $typeStats,
                // Comparison data
                'comparison' => [
                    'created' => $calculateChange($createdThisMonth, $createdLastMonth),
                    'approved' => $calculateChange($approvedRequests, $approvedLastMonth),
                    'rejected' => $calculateChange($rejectedRequests, $rejectedLastMonth),
                    'provisioned' => $calculateChange($provisionedRequests, $provisionedLastMonth),
                ],
                // Trends data
                'trends' => $trendsData,
                // Recent requests
                'recent_requests' => $recentRequests,
            ],
        ]);
    }

    /**
     * Get access request trends for the selected year (12 months or up to current month)
     */
    private function getAccessRequestTrends($query, $year)
    {
        $months = [];
        $currentMonth = date('n'); // 1-12
        $currentYear = date('Y');
        
        // If selected year is current year, only show up to current month
        $maxMonth = ($year == $currentYear) ? $currentMonth : 12;
        
        for ($month = 1; $month <= $maxMonth; $month++) {
            $monthName = date('M', mktime(0, 0, 0, $month, 1));
            
            $pending = (clone $query)->where('status', 0)
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->count();
            
            $approved = (clone $query)->where('status', 1)
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->count();
            
            $rejected = (clone $query)->where('status', 2)
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->count();
            
            $provisioned = (clone $query)->where('status', 3)
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->count();
            
            $months[] = [
                'month' => $monthName,
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
                'provisioned' => $provisioned,
                'total' => $pending + $approved + $rejected + $provisioned,
            ];
        }
        
        return $months;
    }

    /**
     * Get access request counts for mini sidebar badges
     */
    public function counts(Request $request)
    {
        $query = AccessRequest::query();

        // Apply role-based filtering
        if ($request->role === 'agent' || $request->role === 'technical') {
            $query->where(function($q) use ($request) {
                $q->where('pic_technical_id', $request->user_id)
                  ->orWhere('team_id', $request->team_id);
            });
        } elseif ($request->role === 'user') {
            $query->where('requester_id', $request->requester_id);
        }

        // Count only pending access requests for mini sidebar badge
        $pendingCount = $query->where('status', 0)->count();

        return response()->json([
            'status' => true,
            'message' => 'Access request count retrieved successfully',
            'data' => $pendingCount,
        ]);
    }
}
