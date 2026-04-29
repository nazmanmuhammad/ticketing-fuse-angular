<?php

namespace App\Http\Controllers;

use App\Models\AccessRequest;
use App\Models\AccessRequestTrack;
use App\Models\AccessRequestApproval;
use App\Models\AccessRequestApprovalItem;
use App\Models\Attachment;
use App\Models\User;
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
            'assignedUser',
            'assignedTeam',
            'approval.items.user'
        ]);

        // Filter by search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('full_name', 'like', "%{$search}%")
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
                $q->where('assign_to_user_id', $request->assigned_to)
                  ->orWhere('assign_to_team_id', $request->assigned_to);
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
     * Get statistics
     */
    public function statistics(Request $request)
    {
        $query = AccessRequest::query();

        // Filter by requester if provided
        if ($request->has('requester_id') && $request->requester_id) {
            $query->where('requester_id', $request->requester_id);
        }

        $total = (clone $query)->count();
        $pending = (clone $query)->where('status', 0)->count();
        $approved = (clone $query)->where('status', 1)->count();
        $rejected = (clone $query)->where('status', 2)->count();
        $provisioned = (clone $query)->where('status', 3)->count();

        return response()->json([
            'status' => true,
            'message' => 'Statistics retrieved successfully',
            'data' => [
                'total' => $total,
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
                'provisioned' => $provisioned,
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
            'assignedUser',
            'assignedTeam',
            'tracks.user',
            'approval.items.user',
            'attachments',
            'comments.user',
            'comments.attachments',
            'comments.replies.user',
            'comments.replies.attachments'
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
            'requester_id' => 'required|exists:users,id',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'department' => 'required|string|max:255',
            'resource_name' => 'required|string|max:255',
            'request_type' => 'required|in:New Access,Change Access,Revoke Access',
            'access_level' => 'required|in:Viewer,Standard User,Editor,Admin Access',
            'reason' => 'required|string',
            'duration_type' => 'required|in:Temporary Access,Permanent Access',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'assign_type' => 'nullable|in:member,team',
            'assign_to_user_id' => 'nullable|exists:users,id',
            'assign_to_team_id' => 'nullable|exists:teams,id',
            'priority' => 'nullable|integer|min:0|max:3',
            'notify_requester' => 'nullable|boolean',
            'require_manager_approval' => 'nullable|boolean',
            'approval_required' => 'nullable|in:0,1,true,false',
            'approver_ids' => 'nullable|json',
        ]);

        DB::beginTransaction();
        try {
            // Create access request
            $accessRequest = AccessRequest::create([
                'requester_id' => $request->requester_id,
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'department' => $request->department,
                'resource_name' => $request->resource_name,
                'request_type' => $request->request_type,
                'access_level' => $request->access_level,
                'reason' => $request->reason,
                'duration_type' => $request->duration_type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'assign_type' => $request->assign_type ?? 'member',
                'assign_to_user_id' => $request->assign_to_user_id,
                'assign_to_team_id' => $request->assign_to_team_id,
                'status' => 0, // Pending
                'priority' => $request->priority,
                'notify_requester' => $request->notify_requester ?? false,
                'require_manager_approval' => $request->require_manager_approval ?? false,
                'approval_required' => filter_var($request->approval_required, FILTER_VALIDATE_BOOLEAN),
                'approver_ids' => $request->approver_ids ? json_decode($request->approver_ids, true) : null,
            ]);

            // Create activity track
            AccessRequestTrack::create([
                'access_request_id' => $accessRequest->id,
                'user_id' => $request->requester_id,
                'action' => 'created',
                'description' => 'Access request created',
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
                        'user_id' => $request->requester_id,
                        'visible' => true,
                    ]);
                }
            }

            DB::commit();

            // Load relationships
            $accessRequest->load([
                'requester',
                'assignedUser',
                'assignedTeam',
                'tracks.user',
                'approval.items.user',
                'attachments'
            ]);

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
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:50',
            'department' => 'sometimes|string|max:255',
            'resource_name' => 'sometimes|string|max:255',
            'request_type' => 'sometimes|in:New Access,Change Access,Revoke Access',
            'access_level' => 'sometimes|in:Viewer,Standard User,Editor,Admin Access',
            'reason' => 'sometimes|string',
            'duration_type' => 'sometimes|in:Temporary Access,Permanent Access',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'assign_to_user_id' => 'nullable|exists:users,id',
            'assign_to_team_id' => 'nullable|exists:teams,id',
            'priority' => 'nullable|integer|min:0|max:3',
            'status' => 'sometimes|integer|min:0|max:3',
            'user_id' => 'required|exists:users,id', // User performing the update
        ]);

        DB::beginTransaction();
        try {
            $oldStatus = $accessRequest->status;
            
            // Update access request
            $accessRequest->update($request->except(['user_id', 'approver_ids', 'approval_required']));

            // Create activity track
            $action = 'updated';
            $description = 'Access request updated';

            if ($request->has('status') && $request->status != $oldStatus) {
                $statusMap = [
                    0 => 'pending',
                    1 => 'approved',
                    2 => 'rejected',
                    3 => 'provisioned',
                ];
                $action = $statusMap[$request->status] ?? 'updated';
                $description = 'Access request ' . $action;
            }

            AccessRequestTrack::create([
                'access_request_id' => $accessRequest->id,
                'user_id' => $request->user_id,
                'action' => $action,
                'description' => $description,
            ]);

            DB::commit();

            // Load relationships
            $accessRequest->load([
                'requester',
                'assignedUser',
                'assignedTeam',
                'tracks.user',
                'approval.items.user',
                'attachments'
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
     * Create approvals for access request
     */
    private function createApprovals(AccessRequest $accessRequest, array $approverIds)
    {
        // Create approval
        $approval = AccessRequestApproval::create([
            'access_request_id' => $accessRequest->id,
            'level' => 1,
        ]);

        // Create approval items
        foreach ($approverIds as $approverData) {
            AccessRequestApprovalItem::create([
                'access_request_approval_id' => $approval->id,
                'user_id' => $approverData['user_id'],
                'level' => $approverData['level'] ?? 1,
                'status' => 'pending',
            ]);
        }
    }
}