<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketTrack;
use App\TicketStatusEnum;
use Illuminate\Http\Request;

use function Symfony\Component\Clock\now;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 12);
        if ($perPage < 1) {
            $perPage = 12;
        }

        $query = Ticket::query();
        $this->applyFilters($query, $request);
        $data = $query
                ->when($request->role === 'agent', function($q) use($request) {
                    $q->where('pic_helpdesk_id', $request->pic_helpdesk_id);
                })
                ->when($request->role === 'technical', function($q) use($request) {
                    $q->where('pic_id', $request->pic_id);
                })
                ->when($request->role === 'user', function($q) use($request) {
                    $q->where('requester_id', $request->requester_id);
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
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('hris_user_id', 'like', "%{$search}%");
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

        TicketTrack::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->requester_id || $request->pic_helpdesk_id,
            'action' => 'created',
            'description' => 'Ticket dibuat',
        ]);

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
        $data = Ticket::find($id);
        return $data;
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
        $data = Ticket::find($id);

        if($request->assign_technical)
        {
            $data->update([
                'pic_technical_id' => $request->pic_technical_id,
                'pic_technical_assign_date' => now()
            ]);
        }

        if($request->updateStatus && $request->reopened)
        {
            $data->update(['status' => TicketStatusEnum::PROCESS->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::PROCESS->value)
        {
            $data->update(['status' => TicketStatusEnum::PROCESS->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::RESOLVED->value)
        {
            $data->update(['status' => TicketStatusEnum::RESOLVED->value]);
        }

        if($request->updateStatus && $request->status === TicketStatusEnum::CLOSED->value)
        {
            $data->update(['status' => TicketStatusEnum::CLOSED->value]);
        }

        return response()->json([
            'message' => 'Ticket berhasil diperbarui',
            'data' => $data
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $data = Ticket::find($id);
        if($data->status != TicketStatusEnum::PENDING)
        {
            return response()->json([
                'message' => 'Ticket tidak bisa dihapus',
                'data' => $data
            ], 400);
        }

        $data->delete();
        return response()->json([
            'message' => 'Ticket tidak bisa dihapus',
            'data' => $data
        ], 400);
    }
}
