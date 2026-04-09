<?php

namespace App\Http\Controllers;

use App\Jobs\SendTicketNotification;
use App\Models\Attachment;
use App\Models\Ticket;
use App\Models\TicketTrack;
use App\Models\User;
use App\TicketStatusEnum;
use App\UserRoleEnum;
use Illuminate\Http\Request;

use function Symfony\Component\Clock\now;

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

        // Get counts by status
        $newTickets = (clone $query)->where('status', TicketStatusEnum::PENDING->value)
            ->whereDate('created_at', today())
            ->count();

        $pendingTickets = (clone $query)->where('status', TicketStatusEnum::PENDING->value)->count();

        $openTickets = (clone $query)->whereIn('status', [
            TicketStatusEnum::PENDING->value,
            TicketStatusEnum::PROCESS->value
        ])->count();

        $closedTickets = (clone $query)->where('status', TicketStatusEnum::CLOSED->value)
            ->whereMonth('created_at', date('m'))
            ->whereYear('created_at', date('Y'))
            ->count();

        return response()->json([
            'status' => true,
            'message' => 'Ticket statistics retrieved successfully',
            'data' => [
                'new_today' => $newTickets,
                'pending' => $pendingTickets,
                'open' => $openTickets,
                'closed_this_month' => $closedTickets,
            ],
        ]);
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 5);
        if ($perPage < 1) {
            $perPage = 5;
        }

        $query = Ticket::query();
        $this->applyFilters($query, $request);
        $data = $query->with(['requester', 'pic_technical', 'pic_helpdesk'])
                ->when($request->role === 'agent', function($q) use($request) {
                    $q->where('pic_helpdesk_id', $request->user_id);
                })
                ->when($request->role === 'technical', function($q) use($request) {
                    $q->where('pic_technical_id', $request->user_id);
                })
                ->when($request->role === 'user', function($q) use($request) {
                    $q->where('requester_id', $request->user_id);
                })
                ->orderByDesc('created_at')->paginate($perPage)->appends($request->query());

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

        // default status
        $data['status'] = \App\TicketStatusEnum::PENDING->value;

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

        $ticket = Ticket::create($data);
        
        // Get user for ticket track
        $creatorUserId = $request->role === 'agent' ? $request->pic_helpdesk_id : $request->requester_id;
        $creatorUser = User::find($creatorUserId);
        $creatorName = $creatorUser ? $creatorUser->name : 'Unknown';
        
        $activityLog = TicketTrack::create([
            'ticket_id' => $ticket->id,
            'user_id' => $creatorUserId,
            'action' => 'created',
            'description' => 'Ticket dibuat oleh ' . $creatorName,
        ]);

        \Log::info($ticket);
        \Log::info($request->pic_helpdesk_id);


        // Load relationships for email
        $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team']);

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

        return response()->json([
            'status'  => true,
            'message' => 'Ticket Berhasil dibuat',
            'data'    => $ticket,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
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
            'comments.replies.attachments'
        ])->find($id);
        
        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Ticket tidak ditemukan',
                'data' => null
            ], 404);
        }

        // Add status name
        $data->status_name = match($data->status) {
            0 => 'Pending',
            1 => 'Process', 
            2 => 'Resolved',
            3 => 'Closed',
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
                'pic_technical_assign_date' => now()
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
                if ($oldPicTechnicalId) {
                    // Reassignment case
                    $oldTechnical = User::find($oldPicTechnicalId);
                    $description = 'Ticket dialihkan dari ' . ($oldTechnical ? $oldTechnical->name : 'Unknown') . ' ke ' . ($newTechnical ? $newTechnical->name : 'Unknown');
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
            }

            // Send notification to newly assigned technical
            if ($request->pic_technical_id && $request->pic_technical_id != $oldPicTechnicalId) {
                $technical = User::find($request->pic_technical_id);
                if ($technical && $technical->email && filter_var($technical->email, FILTER_VALIDATE_EMAIL)) {
                    $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team']);
                    SendTicketNotification::dispatch($ticket, 'assigned', $technical->email);
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
                    'description' => 'Ticket dibuka kembali',
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
                    'description' => 'Proses ticket dimulai',
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
                    'description' => 'Ticket diselesaikan',
                ]);
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
                    'description' => 'Ticket ditutup',
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
                    'description' => 'Ticket dibuka kembali',
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
                    'user_id' => $request->requester_id ?? $request->pic_helpdesk_id ?? null,
                    'visible' => true,
                ]);
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
            $description = 'Ticket diperbarui';
            
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

        return response()->json([
            'status' => true,
            'message' => 'Ticket berhasil diperbarui',
            'data' => $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team', 'attachments.user'])
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
}
