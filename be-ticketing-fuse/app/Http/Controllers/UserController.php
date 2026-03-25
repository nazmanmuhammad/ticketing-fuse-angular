<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UsersExport;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 12);
        if ($perPage < 1) {
            $perPage = 12;
        }

        $query = User::query()->with('department');
        $this->applyFilters($query, $request);
        $users = $query->orderByDesc('created_at')->paginate($perPage)->appends($request->query());

        return response()->json([
            'status'  => true,
            'message' => 'Data User berhasil diambil',
            'data'    => $users->items(),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $query = User::query()->with('department');
        $this->applyFilters($query, $request);
        $rows = $query->orderByDesc('created_at')->get();

        $fileName = 'users_export_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new UsersExport($rows), $fileName);
    }

    public function store(Request $request)
    {
        $item = User::create($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil dibuat',
            'data'    => $item,
        ], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'status'  => true,
            'message' => 'Data User ditemukan',
            'data'    => User::findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $item = User::findOrFail($id);
        $item->update($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil diperbarui',
            'data'    => $item,
        ]);
    }

    public function destroy(string $id)
    {
        User::findOrFail($id)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil dihapus',
            'data'    => null,
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
}
