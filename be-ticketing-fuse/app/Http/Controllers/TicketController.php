<?php

namespace App\Http\Controllers;

use App\Jobs\SendTicketNotification;
use App\Jobs\SendTicketResolvedNotification;
use App\Models\Attachment;
use App\Models\Ticket;
use App\Models\TicketTrack;
use App\Models\User;
use App\TicketStatusEnum;
use App\UserRoleEnum;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    /**
     * Get ticket statistics
     */
    public function statistics(Request $request)
    {
        $query = Ticket::query();

        // Apply role-based filtering
        if ($request->role === 'agent') {
            $query->where('pic_helpdesk_id', $request->pic_helpdesk_id);
        } elseif ($request->role === 'technical') {
            $query->where('pic_technical_id', $request->pic_id);
        } elseif ($request->role === 'user') {
            $query->where('requester_id', $request->requester_id);
        }

        // Exclude draft tickets for agent and technical
        if ($request->role === 'agent' || $request->role === 'technical') {
            $query->where('status', '!=', TicketStatusEnum::DRAFT->value);
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
        $newTickets = (clone $query)->where('status', TicketStatusEnum::PENDING->value)
            ->whereDate('created_at', today())
            ->count();

        $pendingTickets = (clone $query)->where('status', TicketStatusEnum::PENDING->value)->count();

        $openTickets = (clone $query)->whereIn('status', [
            TicketStatusEnum::PENDING->value,
            TicketStatusEnum::PROCESS->value
        ])->count();

        $closedTickets = (clone $query)->where('status', TicketStatusEnum::CLOSED->value)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();
        
        $resolvedTickets = (clone $query)->where('status', TicketStatusEnum::RESOLVED->value)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();
        
        // Get counts for LAST MONTH for comparison
        $closedTicketsLastMonth = (clone $query)->where('status', TicketStatusEnum::CLOSED->value)
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->count();
        
        $resolvedTicketsLastMonth = (clone $query)->where('status', TicketStatusEnum::RESOLVED->value)
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->count();
        
        // Count tickets by priority - filtered by month/year
        $priorityStats = [
            'emergency' => (clone $query)->where('priority', 4)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'high' => (clone $query)->where('priority', 3)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'medium' => (clone $query)->where('priority', 2)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
            'low' => (clone $query)->where('priority', 1)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count(),
        ];
        
        // Count reopened tickets - Current Month
        $reopenedCount = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                $q->select('id')->from((clone $query)->getQuery());
            })
            ->where('action', 'reopened')
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->distinct('ticket_id')
            ->count('ticket_id');
        
        // Count reopened tickets - Last Month
        $reopenedCountLastMonth = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                $q->select('id')->from((clone $query)->getQuery());
            })
            ->where('action', 'reopened')
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->distinct('ticket_id')
            ->count('ticket_id');
        
        // Count transferred tickets - Current Month
        $transferredCount = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                $q->select('id')->from((clone $query)->getQuery());
            })
            ->where('action', 'reassigned')
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->distinct('ticket_id')
            ->count('ticket_id');
        
        // Count transferred tickets - Last Month
        $transferredCountLastMonth = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                $q->select('id')->from((clone $query)->getQuery());
            })
            ->where('action', 'reassigned')
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->distinct('ticket_id')
            ->count('ticket_id');
        
        // Count overdue tickets - Current Month
        $overdueCount = (clone $query)->whereIn('status', [
                TicketStatusEnum::RESOLVED->value,
                TicketStatusEnum::CLOSED->value
            ])
            ->whereNotNull('end_date')
            ->whereRaw('updated_at > end_date')
            ->whereMonth('updated_at', $currentMonth)
            ->whereYear('updated_at', $currentYear)
            ->count();
        
        // Count overdue tickets - Last Month
        $overdueCountLastMonth = (clone $query)->whereIn('status', [
                TicketStatusEnum::RESOLVED->value,
                TicketStatusEnum::CLOSED->value
            ])
            ->whereNotNull('end_date')
            ->whereRaw('updated_at > end_date')
            ->whereMonth('updated_at', $lastMonth)
            ->whereYear('updated_at', $lastMonthYear)
            ->count();
        
        // Count created tickets this month
        $createdThisMonth = (clone $query)
            ->whereMonth('created_at', $currentMonth)
            ->whereYear('created_at', $currentYear)
            ->count();
        
        // Count created tickets last month
        $createdLastMonth = (clone $query)
            ->whereMonth('created_at', $lastMonth)
            ->whereYear('created_at', $lastMonthYear)
            ->count();
        
        // Get trends data for the selected year (12 months)
        $trendsData = $this->getTicketTrends($query, $currentYear);

        return response()->json([
            'status' => true,
            'message' => 'Ticket statistics retrieved successfully',
            'data' => [
                'new_today' => $newTickets,
                'pending' => $pendingTickets,
                'open' => $openTickets,
                'closed_this_month' => $closedTickets,
                'resolved' => $resolvedTickets,
                'reopened' => $reopenedCount,
                'transferred' => $transferredCount,
                'overdue' => $overdueCount,
                'created_this_month' => $createdThisMonth,
                'priority' => $priorityStats,
                // Comparison data
                'comparison' => [
                    'created' => $calculateChange($createdThisMonth, $createdLastMonth),
                    'closed' => $calculateChange($closedTickets, $closedTicketsLastMonth),
                    'reopened' => $calculateChange($reopenedCount, $reopenedCountLastMonth),
                    'transferred' => $calculateChange($transferredCount, $transferredCountLastMonth),
                    'overdue' => $calculateChange($overdueCount, $overdueCountLastMonth),
                ],
                // Trends data
                'trends' => $trendsData,
            ],
        ]);
    }
    
    /**
     * Get ticket trends for the selected year (12 months or up to current month)
     */
    private function getTicketTrends($query, $year)
    {
        $months = [];
        $created = [];
        $assigned = [];
        $closed = [];
        $overdue = [];
        $reopened = [];
        $transferred = [];
        
        // Determine the end month
        $currentYear = (int) date('Y');
        $currentMonth = (int) date('m');
        
        // If selected year is current year, only show up to current month
        // Otherwise show all 12 months
        $endMonth = ($year == $currentYear) ? $currentMonth : 12;
        
        // Get data for months 1 to endMonth
        for ($monthNum = 1; $monthNum <= $endMonth; $monthNum++) {
            $date = Carbon::create($year, $monthNum, 1);
            $month = $date->format('M');
            
            $months[] = $month;
            
            // Created tickets - based on ticket creation date
            $created[] = (clone $query)
                ->whereMonth('created_at', $monthNum)
                ->whereYear('created_at', $year)
                ->count();
            
            // Assigned tickets - based on ticket_tracks with 'assigned' action
            $assigned[] = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                    $q->select('id')->from((clone $query)->getQuery());
                })
                ->where('action', 'assigned')
                ->whereMonth('created_at', $monthNum)
                ->whereYear('created_at', $year)
                ->distinct('ticket_id')
                ->count('ticket_id');
            
            // Closed tickets - based on when status changed to closed
            $closed[] = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                    $q->select('id')->from((clone $query)->getQuery());
                })
                ->where('action', 'closed')
                ->whereMonth('created_at', $monthNum)
                ->whereYear('created_at', $year)
                ->distinct('ticket_id')
                ->count('ticket_id');
            
            // Overdue tickets - tickets that were completed after end_date
            $overdue[] = (clone $query)
                ->whereIn('status', [
                    TicketStatusEnum::RESOLVED->value,
                    TicketStatusEnum::CLOSED->value
                ])
                ->whereNotNull('end_date')
                ->whereRaw('updated_at > end_date')
                ->whereMonth('updated_at', $monthNum)
                ->whereYear('updated_at', $year)
                ->count();
            
            // Reopened tickets - based on ticket_tracks with 'reopened' action
            $reopened[] = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                    $q->select('id')->from((clone $query)->getQuery());
                })
                ->where('action', 'reopened')
                ->whereMonth('created_at', $monthNum)
                ->whereYear('created_at', $year)
                ->distinct('ticket_id')
                ->count('ticket_id');
            
            // Transferred tickets - based on ticket_tracks with 'reassigned' action
            $transferred[] = TicketTrack::whereIn('ticket_id', function($q) use ($query) {
                    $q->select('id')->from((clone $query)->getQuery());
                })
                ->where('action', 'reassigned')
                ->whereMonth('created_at', $monthNum)
                ->whereYear('created_at', $year)
                ->distinct('ticket_id')
                ->count('ticket_id');
        }
        
        return [
            'months' => $months,
            'created' => $created,
            'assigned' => $assigned,
            'closed' => $closed,
            'overdue' => $overdue,
            'reopened' => $reopened,
            'transferred' => $transferred,
        ];
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 5);
        if ($perPage < 1) {
            $perPage = 5;
        }

        $query = Ticket::query();
        $this->applyFilters($query, $request);
        
        // Apply month/year filter if provided
        if ($request->has('month') && $request->has('year')) {
            $query->whereMonth('created_at', $request->month)
                  ->whereYear('created_at', $request->year);
        }
        
        // Filter draft tickets - only show to requester
        // Agent and Technical should not see draft tickets
        if ($request->role === 'agent' || $request->role === 'technical') {
            // Exclude draft tickets for agent and technical
            $query->where('status', '!=', \App\TicketStatusEnum::DRAFT->value);
        } elseif ($request->role === 'user') {
            // User can see their own draft tickets
            // This is already handled by requester_id filter below
        }
        
        $data = $query->with(['requester', 'pic_technical', 'pic_helpdesk']);

        if ($request->pic_id) {
            $data = $data
                ->when($request->role === 'agent', function($q) use($request) {
                    $q->where('pic_helpdesk_id', $request->pic_id);
                })
                ->when($request->role === 'technical', function($q) use($request) {
                    $q->where('pic_technical_id', $request->pic_id);
                })
                ->when($request->role === 'user', function($q) use($request) {
                    $q->where('requester_id', $request->pic_id);
                });
        }

        $data = $data->orderByDesc('created_at')->paginate($perPage)->appends($request->query());

        return response()->json([
            'status'  => true,
            'message' => 'Data Ticket berhasil diambil',
            'data'    => $data->items(),
            'meta'    => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
            ],
        ]);
    }

    private function applyFilters($query, Request $request): void
    {
        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $statusParam = $request->query('status');
        if ($statusParam !== null && $statusParam !== '' && strtolower((string) $statusParam) !== 'all') {
            if (is_numeric($statusParam)) {
                $query->where('status', (int) $statusParam);
            }
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->all();

        // Check and create user if not exists (for requester)
        if ($request->requester_type === 'select_employee' && $request->requester_id) {
            // Check if user already exists by hris_user_id or email
            $user = User::withTrashed()->where(function($query) use ($request) {
                $query->where('hris_user_id', $request->requester_id)
                      ->orWhere('email', $request->email);
            })->first();
            
            if (!$user) {
                // Only create if user doesn't exist
                User::create([
                    'hris_user_id' => $request->requester_id,
                    'name' => $request->name,
                    'email' => $request->email,
                    'photo' => $request->requester_photo ?? null,
                    'role' => UserRoleEnum::USER->value,
                    'status' => 1, // active
                ]);
            }
        }

        // Generate ticket number
        $data['ticket_number'] = Ticket::generateTicketNumber();

        // Handle status based on request
        if ($request->has('status')) {
            // If status is explicitly provided (e.g., -1 for draft)
            $data['status'] = (int) $request->status;
        } elseif (!$request->close_on_response) {
            // Default status is PENDING
            $data['status'] = \App\TicketStatusEnum::PENDING->value;
        }

        // USER buat ticket
        if ($request->role === 'user') {
            $data['requester_id'] = $request->requester_id;
        }

        // AGENT HELPDESK buat ticket
        if ($request->role === 'agent') {
            $data['pic_helpdesk_id'] = $request->pic_helpdesk_id;

            if (!$request->requester_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'Requester wajib diisi'
                ], 422);
            }
        }

        if($request->close_on_response)
        {
            $data['status'] = \App\TicketStatusEnum::CLOSED->value;
        }

        $ticket = Ticket::create($data);
        
        // Get user for ticket track
        $creatorUserId = $request->role === 'agent' ? $request->pic_helpdesk_id : $request->requester_id;
        $creatorUser = User::find($creatorUserId);
        $creatorName = $creatorUser ? $creatorUser->name : 'Unknown';
        
        $activityLog = TicketTrack::create([
            'ticket_id' => $ticket->id,
            'user_id' => $creatorUserId,
            'action' => 'created',
            'description' => 'Ticket created by ' . $creatorName,
        ]);

        \Log::info($ticket);
        \Log::info($request->pic_helpdesk_id);


        // Load relationships for email
        $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team']);

        // Only send notifications if ticket is not a draft
        if ($ticket->status !== \App\TicketStatusEnum::DRAFT->value) {
            // Send notification to requester (email in ticket)
            if ($ticket->email && filter_var($ticket->email, FILTER_VALIDATE_EMAIL)) {
                SendTicketNotification::dispatch($ticket, 'created');
            }

            // Send notification to pic_helpdesk if exists
            if ($ticket->pic_helpdesk && $ticket->pic_helpdesk->email && filter_var($ticket->pic_helpdesk->email, FILTER_VALIDATE_EMAIL)) {
                SendTicketNotification::dispatch($ticket, 'assigned', $ticket->pic_helpdesk->email);
            }

            // Send notification to assigned technical if pic_technical_id is set
            if ($ticket->pic_technical && $ticket->pic_technical->email && filter_var($ticket->pic_technical->email, FILTER_VALIDATE_EMAIL)) {
                SendTicketNotification::dispatch($ticket, 'assigned', $ticket->pic_technical->email);
            }
        }

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('public/tickets/' . date('Y/m/d'));
                
                Attachment::create([
                    'attachmentable_id' => $ticket->id,
                    'attachmentable_type' => Ticket::class,
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'mime' => $file->extension(),
                    'user_id' => $request->requester_id ?? $request->pic_helpdesk_id ?? null,
                    'visible' => true,
                ]);
            }
        }

        // Handle approvers if approval is required
        \Log::info('Approval Debug', [
            'approval_required' => $request->approval_required,
            'approver_ids' => $request->approver_ids,
            'has_approver_ids' => $request->has('approver_ids'),
            'all_request' => $request->all()
        ]);

        if ($request->approval_required == '1' && $request->has('approver_ids') && $request->approver_ids) {
            $approverIds = is_string($request->approver_ids) 
                ? json_decode($request->approver_ids, true) 
                : $request->approver_ids;
            
            \Log::info('Approver IDs decoded', ['approverIds' => $approverIds]);
            
            if (is_array($approverIds) && count($approverIds) > 0) {
                // Get the actual user UUID for requested_by
                $requestedByUserId = null;
                if ($request->role === 'agent') {
                    $requestedByUserId = $request->pic_helpdesk_id;
                } elseif ($request->role === 'user' && $request->requester_id) {
                    // Find user by hris_user_id to get UUID
                    $requesterUser = User::where('hris_user_id', $request->requester_id)->first();
                    $requestedByUserId = $requesterUser ? $requesterUser->id : null;
                } elseif ($request->user_id) {
                    // Fallback to user_id if provided
                    $requestedByUserId = $request->user_id;
                }
                
                \Log::info('Requested By User ID', [
                    'requestedByUserId' => $requestedByUserId,
                    'role' => $request->role,
                    'pic_helpdesk_id' => $request->pic_helpdesk_id,
                    'requester_id' => $request->requester_id,
                    'user_id' => $request->user_id
                ]);
                
                // Only create approval if we have a valid requested_by user
                if ($requestedByUserId) {
                    \Log::info('Creating approval for ticket', ['ticket_id' => $ticket->id]);
                    
                    // Create approval (parent)
                    $approval = \App\Models\Approval::create([
                        'approvable_id' => $ticket->id,
                        'approvable_type' => \App\Models\Ticket::class,
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
                } else {
                    \Log::warning('Cannot create approval: requestedByUserId is null');
                }
            }
        }

        return response()->json([
            'status'  => true,
            'message' => 'Ticket Berhasil dibuat',
            'data'    => $ticket,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id, Request $request)
    {
        $data = Ticket::with([
            'requester', 
            'pic_technical', 
            'pic_helpdesk', 
            'team', 
            'ticketTrack.user',
            'attachments.user',
            'comments.user',
            'comments.attachments',
            'comments.replies.user',
            'comments.replies.attachments',
            'approval.items.user',
            'approval.requester'
        ])->find($id);
        
        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Ticket tidak ditemukan',
                'data' => null
            ], 404);
        }

        // Check if ticket is draft and user is not the requester
        if ($data->status === \App\TicketStatusEnum::DRAFT->value) {
            // Only requester can view draft tickets
            $userId = $request->user_id ?? $request->requester_id;
            
            if ($data->requester_id !== $userId) {
                return response()->json([
                    'status' => false,
                    'message' => 'You do not have permission to view this draft ticket',
                    'data' => null
                ], 403);
            }
        }

        // Add status name
        $data->status_name = match($data->status) {
            -1 => 'Draft',
            0 => 'Pending',
            1 => 'Process', 
            2 => 'Resolved',
            3 => 'Closed',
            4 => 'Cancelled',
            default => 'Unknown'
        };

        return response()->json([
            'status' => true,
            'message' => 'Data Ticket berhasil diambil',
            'data' => $data
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $ticket = Ticket::find($id);
        
        if (!$ticket) {
            return response()->json([
                'status' => false,
                'message' => 'Ticket tidak ditemukan'
            ], 404);
        }

        $data = $request->all();
        $oldPicTechnicalId = $ticket->pic_technical_id;

        // Check and create user if requester is being updated and not exists
        if ($request->has('requester_id') && $request->requester_id) {
            if ($request->requester_type === 'select_employee') {
                // Check if user already exists by hris_user_id or email
                $existingUser = User::withTrashed()->where(function($query) use ($request) {
                    $query->where('hris_user_id', $request->requester_id)
                          ->orWhere('email', $request->email);
                })->first();
                
                if (!$existingUser) {
                    // Only create if user doesn't exist
                    User::create([
                        'hris_user_id' => $request->requester_id,
                        'name' => $request->name,
                        'email' => $request->email,
                        'photo' => $request->requester_photo ?? null,
                        'role' => UserRoleEnum::USER->value,
                        'status' => 1, // active
                    ]);
                }
            }
        }

        // Handle general ticket update
        if ($request->has(['name', 'email', 'phone_number', 'extension_number', 'ticket_source', 'department_id', 'help_topic', 'subject_issue', 'issue_detail', 'priority', 'assign_status'])) {
            $ticket->update($data);
        }

        // Handle assignment
        if($request->assign_technical || $request->has('pic_technical_id'))
        {
            $ticket->update([
                'pic_technical_id' => $request->pic_technical_id,
                'pic_technical_assign_date' => Carbon::now()
            ]);

            // Create ticket track for assignment
            if ($request->assign_technical && $request->pic_technical_id) {
                $newTechnical = User::find($request->pic_technical_id);
                $currentUser = $request->user_id ? User::find($request->user_id) : null;
                
                // Get user_id for ticket track (current user who did the assignment)
                $userId = null;
                if ($request->user_id) {
                    $userId = $request->user_id;
                } elseif ($request->role === 'agent' && $request->pic_helpdesk_id) {
                    $userId = $request->pic_helpdesk_id;
                } elseif ($request->requester_id) {
                    $user = User::where('hris_user_id', $request->requester_id)->first();
                    $userId = $user ? $user->id : null;
                }
                
                // Create ticket track with different description based on whether it's first assignment or reassignment
                $action = 'assigned';
                $isReassignment = false;
                if ($oldPicTechnicalId) {
                    // Reassignment case
                    $isReassignment = true;
                    $oldTechnical = User::find($oldPicTechnicalId);
                    $description = 'Ticket reassigned from ' . ($oldTechnical ? $oldTechnical->name : 'Unknown') . ' to ' . ($newTechnical ? $newTechnical->name : 'Unknown');
                } else {
                    // First time assignment
                    $byUser = $currentUser ? ' by ' . $currentUser->name : '';
                    $description = 'Ticket assigned to ' . ($newTechnical ? $newTechnical->name : 'Unknown') . $byUser;
                }
                
                if ($userId) {
                    TicketTrack::create([
                        'ticket_id' => $ticket->id,
                        'user_id' => $userId,
                        'action' => $action,
                        'description' => $description,
                    ]);
                }
                
                // Send email notification to new technical
                if ($newTechnical && $newTechnical->email && filter_var($newTechnical->email, FILTER_VALIDATE_EMAIL)) {
                    $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team']);
                    
                    if ($isReassignment) {
                        // Send reassignment notification
                        SendTicketNotification::dispatch($ticket, 'reassigned', $newTechnical->email);
                    } else {
                        // Send first assignment notification
                        SendTicketNotification::dispatch($ticket, 'assigned', $newTechnical->email);
                    }
                }
            }
        }

        // Handle status updates
        if($request->reopen)
        {
            $ticket->update(['status' => TicketStatusEnum::PROCESS->value]);
            
            // Create ticket track for reopen
            $userId = $request->user_id ?? null;
            if ($userId) {
                TicketTrack::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'reopened',
                    'description' => 'Ticket reopened',
                ]);
            }
        }

        if($request->start_process)
        {
            $ticket->update(['status' => TicketStatusEnum::PROCESS->value]);
            
            // Create ticket track for start process
            $userId = $request->user_id ?? null;
            if ($userId) {
                TicketTrack::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'started',
                    'description' => 'Ticket process started',
                ]);
            }
        }

        if($request->resolve_ticket)
        {
            $ticket->update(['status' => TicketStatusEnum::RESOLVED->value]);
            
            // Create ticket track for resolve
            $userId = $request->user_id ?? null;
            if ($userId) {
                TicketTrack::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'resolved',
                    'description' => 'Ticket resolved',
                ]);
            }
            
            // Send email notification to requester
            if ($ticket->email && filter_var($ticket->email, FILTER_VALIDATE_EMAIL)) {
                $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team']);
                SendTicketResolvedNotification::dispatch($ticket);
            }
        }

        if($request->close_ticket)
        {
            $ticket->update(['status' => TicketStatusEnum::CLOSED->value]);
            
            // Create ticket track for close
            $userId = $request->user_id ?? null;
            if ($userId) {
                TicketTrack::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'closed',
                    'description' => 'Ticket closed',
                ]);
            }
        }

        if($request->cancel_ticket)
        {
            $ticket->update(['status' => TicketStatusEnum::CANCELLED->value]);
            
            // Create ticket track for cancel
            $userId = $request->user_id ?? null;
            if ($userId) {
                $user = User::find($userId);
                $userName = $user ? $user->name : 'Unknown';
                
                TicketTrack::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'cancelled',
                    'description' => 'Ticket cancelled by ' . $userName,
                ]);
            }
        }

        // Legacy support for updateStatus
        if($request->updateStatus && $request->reopened)
        {
            $ticket->update(['status' => TicketStatusEnum::PROCESS->value]);
            
            $userId = $request->user_id ?? null;
            if ($userId) {
                TicketTrack::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => 'reopened',
                    'description' => 'Ticket reopened',
                ]);
            }
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::PROCESS->value && !$request->start_process)
        {
            $ticket->update(['status' => TicketStatusEnum::PROCESS->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::RESOLVED->value && !$request->resolve_ticket)
        {
            $ticket->update(['status' => TicketStatusEnum::RESOLVED->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::CLOSED->value && !$request->close_ticket)
        {
            $ticket->update(['status' => TicketStatusEnum::CLOSED->value]);
        }

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('public/tickets/' . date('Y/m/d'));
                
                Attachment::create([
                    'attachmentable_id' => $ticket->id,
                    'attachmentable_type' => Ticket::class,
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'mime' => $file->extension(),
                    'user_id' => $request->user_id ?? $request->requester_id ?? $request->pic_helpdesk_id ?? null,
                    'visible' => true,
                ]);
            }
        }

        // Handle deleted attachments
        if ($request->has('deleted_attachments')) {
            $deletedIds = $request->deleted_attachments;
            if (is_array($deletedIds)) {
                foreach ($deletedIds as $attachmentId) {
                    $attachment = Attachment::where('id', $attachmentId)
                        ->where('attachmentable_id', $ticket->id)
                        ->where('attachmentable_type', Ticket::class)
                        ->first();
                    
                    if ($attachment) {
                        // Delete file from storage
                        if (\Storage::exists($attachment->path)) {
                            \Storage::delete($attachment->path);
                        }
                        // Delete record from database
                        $attachment->delete();
                    }
                }
            }
        }

        // Create ticket track for other updates (not assignment and not status changes)
        // Skip if: assign_technical, start_process, resolve_ticket, close_ticket, reopen, or updateStatus
        $skipTicketTrack = $request->assign_technical 
            || $request->start_process 
            || $request->resolve_ticket 
            || $request->close_ticket 
            || $request->reopen 
            || $request->updateStatus;
            
        if (!$skipTicketTrack && $request->has(['name', 'email', 'phone_number', 'extension_number', 'ticket_source', 'department_id', 'help_topic', 'subject_issue', 'issue_detail', 'priority', 'assign_status'])) {
            $action = 'updated';
            $description = 'Ticket updated';
            
            // Get user_id for ticket track
            $userId = null;
            if ($request->user_id) {
                $userId = $request->user_id;
            } elseif ($request->role === 'agent' && $request->pic_helpdesk_id) {
                $userId = $request->pic_helpdesk_id;
            } elseif ($request->requester_id) {
                // Find user by hris_user_id to get the UUID
                $user = User::where('hris_user_id', $request->requester_id)->first();
                $userId = $user ? $user->id : null;
            }

            if ($userId) {
                TicketTrack::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'action' => $action,
                    'description' => $description,
                ]);
            }
        }

        // Handle approval updates
        if ($request->has('approval_required')) {
            if ($request->approval_required && $request->approver_ids) {
                $approverIds = is_string($request->approver_ids) 
                    ? json_decode($request->approver_ids, true) 
                    : $request->approver_ids;
                
                if (is_array($approverIds) && count($approverIds) > 0) {
                    // Check if approval already exists
                    $existingApproval = $ticket->approval;
                    
                    if ($existingApproval) {
                        // Delete old approval items
                        $existingApproval->items()->delete();
                        
                        // Update approval status
                        $existingApproval->update(['status' => 'pending']);
                        
                        // Create new approval items
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
                                    'approval_id' => $existingApproval->id,
                                    'user_id' => $userId,
                                    'level' => $level,
                                    'status' => 'pending',
                                ];
                            }
                        }
                        
                        if (count($approvalItems) > 0) {
                            $existingApproval->items()->createMany($approvalItems);
                        }
                    } else {
                        // Create new approval
                        $approval = \App\Models\Approval::create([
                            'approvable_id' => $ticket->id,
                            'approvable_type' => \App\Models\Ticket::class,
                            'status' => 'pending',
                            'requested_by' => $request->user_id ?? null,
                        ]);

                        // Create approval items
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
                        
                        if (count($approvalItems) > 0) {
                            $approval->items()->createMany($approvalItems);
                        }
                    }
                }
            } elseif (!$request->approval_required) {
                // Remove approval if approval_required is false
                $existingApproval = $ticket->approval;
                if ($existingApproval) {
                    $existingApproval->items()->delete();
                    $existingApproval->delete();
                }
            }
        }

        return response()->json([
            'status' => true,
            'message' => 'Ticket berhasil diperbarui',
            'data' => $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team', 'attachments.user', 'approval.items.user'])
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $data = Ticket::find($id);
        
        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Ticket tidak ditemukan'
            ], 404);
        }
        
        if($data->status != TicketStatusEnum::PENDING->value)
        {
            return response()->json([
                'status' => false,
                'message' => 'Ticket tidak bisa dihapus karena sudah diproses',
                'data' => $data
            ], 400);
        }

        $data->delete();
        
        return response()->json([
            'status' => true,
            'message' => 'Ticket berhasil dihapus',
            'data' => $data
        ], 200);
    }
    
    /**
     * Get ticket counts for mini sidebar badges
     */
    public function counts(Request $request)
    {
        $query = Ticket::query();

        // Apply role-based filtering
        if ($request->role === 'agent') {
            $query->where('pic_helpdesk_id', $request->user_id);
        } elseif ($request->role === 'technical') {
            $query->where('pic_technical_id', $request->user_id);
        } elseif ($request->role === 'user') {
            $query->where('requester_id', $request->requester_id);
        }

        // Count only pending tickets for mini sidebar badge
        $pendingCount = $query->where('status', TicketStatusEnum::PENDING->value)->count();

        return response()->json([
            'status' => true,
            'message' => 'Ticket count retrieved successfully',
            'data' => $pendingCount,
        ]);
    }
}
