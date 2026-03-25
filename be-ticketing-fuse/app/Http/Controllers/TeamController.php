<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\TeamUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TeamsExport;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 12);
        if ($perPage < 1) {
            $perPage = 12;
        }

        $query = Team::query()->with(['teamUsers.user']);
        $this->applyFilters($query, $request);
        $data = $query->orderByDesc('created_at')->paginate($perPage)->appends($request->query());

        return response()->json([
            'status'  => true,
            'message' => 'Data Team berhasil diambil',
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'members' => ['required', 'array', 'min:1'],
            'members.*' => ['required', 'exists:users,id'],
        ]);

        $memberIds = collect($validated['members'])
            ->filter()
            ->unique()
            ->values();

        $team = DB::transaction(function () use ($validated, $memberIds) {
            $team = Team::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            foreach ($memberIds as $userId) {
                TeamUser::create([
                    'team_id' => $team->id,
                    'user_id' => $userId,
                ]);
            }

            return $team;
        });

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil dibuat',
            'data'    => $team->load('teamUsers.user'),
        ], 201);
    }

    public function show(string $id)
    {
        $item = Team::with('teamUsers.user')->findOrFail($id);

        return response()->json([
            'status'  => true,
            'message' => 'Data Team ditemukan',
            'data'    => $item,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'members' => ['sometimes', 'array'],
            'members.*' => ['required', 'exists:users,id'],
        ]);

        $item = Team::findOrFail($id);
        $memberIds = collect($validated['members'] ?? [])
            ->filter()
            ->unique()
            ->values();

        DB::transaction(function () use ($item, $request, $validated, $memberIds) {
            $item->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            if ($request->has('members')) {
                TeamUser::where('team_id', $item->id)->delete();
                foreach ($memberIds as $userId) {
                    TeamUser::create([
                        'team_id' => $item->id,
                        'user_id' => $userId,
                    ]);
                }
            }
        });

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil diperbarui',
            'data'    => $item->load('teamUsers.user'),
        ]);
    }

    public function destroy(string $id)
    {
        Team::findOrFail($id)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil dihapus',
            'data'    => null,
        ]);
    }

    public function addUser(Request $request)
    {
        $item = TeamUser::create($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil dibuat',
            'data'    => $item,
        ], 201);
    }

    public function export(Request $request)
    {
        $query = Team::query()->with(['teamUsers.user']);
        $this->applyFilters($query, $request);
        $rows = $query->orderByDesc('created_at')->get();

        $fileName = 'teams_export_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new TeamsExport($rows), $fileName);
    }

    private function applyFilters($query, Request $request): void
    {
        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (Schema::hasColumn('teams', 'status')) {
            $statusParam = $request->query('status');
            if ($statusParam !== null && $statusParam !== '' && strtolower((string) $statusParam) !== 'all') {
                if (is_numeric($statusParam)) {
                    $query->where('status', (int) $statusParam);
                }
            }
        }
    }

    private function resolveStatusLabel(Team $team): string
    {
        if (Schema::hasColumn('teams', 'status')) {
            return (int) ($team->status ?? 1) === 1 ? 'Active' : 'Inactive';
        }

        return 'Active';
    }
}
