<?php

namespace App\Http\Controllers;

use App\Models\RequestType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RequestTypeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = RequestType::with('accessLevels');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        $query->orderBy('created_at', 'desc');

        $requestTypes = $query->paginate($perPage);

        return response()->json([
            'data' => $requestTypes->items(),
            'meta' => [
                'current_page' => $requestTypes->currentPage(),
                'last_page' => $requestTypes->lastPage(),
                'per_page' => $requestTypes->perPage(),
                'total' => $requestTypes->total(),
                'from' => $requestTypes->firstItem(),
                'to' => $requestTypes->lastItem(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $requestType = RequestType::create($request->only(['name', 'description', 'status']));

        return response()->json([
            'message' => 'Request type created successfully',
            'data' => $requestType,
        ], 201);
    }

    public function show(string $id)
    {
        $requestType = RequestType::with('accessLevels')->findOrFail($id);

        return response()->json([
            'data' => $requestType,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $requestType = RequestType::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $requestType->update($request->only(['name', 'description', 'status']));

        return response()->json([
            'message' => 'Request type updated successfully',
            'data' => $requestType,
        ]);
    }

    public function destroy(string $id)
    {
        $requestType = RequestType::findOrFail($id);
        $requestType->delete();

        return response()->json([
            'message' => 'Request type deleted successfully',
        ]);
    }

    public function export(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = RequestType::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        $query->orderBy('created_at', 'desc');

        $requestTypes = $query->get();

        $csv = "Name,Description,Status,Created At\n";
        foreach ($requestTypes as $type) {
            $statusText = $type->status == 1 ? 'Active' : 'Inactive';
            $csv .= '"' . str_replace('"', '""', $type->name) . '",';
            $csv .= '"' . str_replace('"', '""', $type->description ?? '') . '",';
            $csv .= '"' . $statusText . '",';
            $csv .= '"' . $type->created_at->format('Y-m-d H:i:s') . '"' . "\n";
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="request_types_export.csv"');
    }
}
