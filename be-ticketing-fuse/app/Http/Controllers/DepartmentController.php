<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DepartmentsExport;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage < 1) {
            $perPage = 10;
        }

        $query = Department::query();
        $this->applyFilters($query, $request);
        $departments = $query->orderByDesc('created_at')->paginate($perPage)->appends($request->query());

        return response()->json([
            'status'  => true,
            'message' => 'Data Department berhasil diambil',
            'data'    => $departments->items(),
            'meta'    => [
                'current_page' => $departments->currentPage(),
                'last_page' => $departments->lastPage(),
                'per_page' => $departments->perPage(),
                'total' => $departments->total(),
                'from' => $departments->firstItem(),
                'to' => $departments->lastItem(),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $query = Department::query();
        $this->applyFilters($query, $request);
        $rows = $query->orderByDesc('created_at')->get();

        $fileName = 'departments_export_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new DepartmentsExport($rows), $fileName);
    }

    public function store(Request $request)
    {
        $item = Department::create($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Department berhasil dibuat',
            'data'    => $item,
        ], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'status'  => true,
            'message' => 'Data Department ditemukan',
            'data'    => Department::findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $item = Department::findOrFail($id);
        $item->update($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Department berhasil diperbarui',
            'data'    => $item,
        ]);
    }

    public function destroy(string $id)
    {
        Department::findOrFail($id)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Department berhasil dihapus',
            'data'    => null,
        ]);
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

        $statusParam = $request->query('status');
        if ($statusParam !== null && $statusParam !== '' && strtolower((string) $statusParam) !== 'all') {
            if (is_numeric($statusParam)) {
                $query->where('status', (int) $statusParam);
            }
        }
    }
}
