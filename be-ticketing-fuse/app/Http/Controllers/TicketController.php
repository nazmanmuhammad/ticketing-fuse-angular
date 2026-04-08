<?php

namespace App\Http\Controllers;

use App\Jobs\SendTicketNotification;
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
                // ->when($request->role === 'agent', function($q) use($request) {
                //     $q->where('pic_helpdesk_id', $request->pic_helpdesk_id);
                // })
                // ->when($request->role === 'technical', function($q) use($request) {
                //     $q->where('pic_technical_id', $request->pic_id);
                // })
                // ->when($request->role === 'user', function($q) use($request) {
                //     $q->where('requester_id', $request->requester_id);
                // })
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
            $user = User::where('hris_user_id', $request->requester_id)->first();
            
            if (!$user) {
                // Create new user with role 'user' (0)
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
        
        $activityLog = TicketTrack::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->role === 'agent' ? $request->pic_helpdesk_id : $request->requester_id,
            'action' => 'created',
            'description' => 'Ticket dibuat',
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
            'ticketTrack.user'
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
                // Check if user already exists by hris_user_id
                $existingUser = User::where('hris_user_id', $request->requester_id)->first();
                
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
        if($request->updateStatus && $request->reopened)
        {
            $ticket->update(['status' => TicketStatusEnum::PROCESS->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::PROCESS->value)
        {
            $ticket->update(['status' => TicketStatusEnum::PROCESS->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::RESOLVED->value)
        {
            $ticket->update(['status' => TicketStatusEnum::RESOLVED->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::CLOSED->value)
        {
            $ticket->update(['status' => TicketStatusEnum::CLOSED->value]);
        }

        // Create ticket track based on update type
        $action = 'updated';
        $description = 'Ticket diperbarui';
        
        if ($request->has('pic_technical_id') || $request->assign_technical) {
            $action = 'assigned';
            $description = 'Ticket di-assign ke technical';
        } elseif ($request->updateStatus) {
            $action = 'status_changed';
            $description = 'Status ticket diubah';
        }
        
        // Get user_id for ticket track
        $userId = null;
        if ($request->role === 'agent' && $request->pic_helpdesk_id) {
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

        return response()->json([
            'status' => true,
            'message' => 'Ticket berhasil diperbarui',
            'data' => $ticket->load(['requester', 'pic_technical', 'pic_helpdesk', 'team'])
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
