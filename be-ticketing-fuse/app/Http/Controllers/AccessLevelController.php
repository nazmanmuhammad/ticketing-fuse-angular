<?php

namespace App\Http\Controllers;

use App\Models\AccessLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccessLevelController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $requestTypeId = $request->input('request_type_id', '');

        $query = AccessLevel::with('requestType');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        // Filter by request type (for dependent dropdown)
        if ($requestTypeId) {
            $query->where('request_type_id', $requestTypeId);
        }

        $query->orderBy('created_at', 'desc');

        $accessLevels = $query->paginate($perPage);

        return response()->json([
            'status' => true,
            'data' => $accessLevels->items(),
            'meta' => [
                'current_page' => $accessLevels->currentPage(),
                'last_page' => $accessLevels->lastPage(),
                'per_page' => $accessLevels->perPage(),
                'total' => $accessLevels->total(),
                'from' => $accessLevels->firstItem(),
                'to' => $accessLevels->lastItem(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'request_type_id' => 'required|uuid|exists:request_types,id',
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

        $accessLevel = AccessLevel::create($request->only(['request_type_id', 'name', 'description', 'status']));

        return response()->json([
            'message' => 'Access level created successfully',
            'data' => $accessLevel->load('requestType'),
        ], 201);
    }

    public function show(string $id)
    {
        $accessLevel = AccessLevel::with('requestType')->findOrFail($id);

        return response()->json([
            'data' => $accessLevel,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $accessLevel = AccessLevel::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'request_type_id' => 'required|uuid|exists:request_types,id',
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

        $accessLevel->update($request->only(['request_type_id', 'name', 'description', 'status']));

        return response()->json([
            'message' => 'Access level updated successfully',
            'data' => $accessLevel->load('requestType'),
        ]);
    }

    public function destroy(string $id)
    {
        $accessLevel = AccessLevel::findOrFail($id);
        $accessLevel->delete();

        return response()->json([
            'message' => 'Access level deleted successfully',
        ]);
    }

    public function export(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $requestTypeId = $request->input('request_type_id', '');

        $query = AccessLevel::with('requestType');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($requestTypeId) {
            $query->where('request_type_id', $requestTypeId);
        }

        $query->orderBy('created_at', 'desc');

        $accessLevels = $query->get();

        $csv = "Request Type,Name,Description,Status,Created At\n";
        foreach ($accessLevels as $level) {
            $statusText = $level->status == 1 ? 'Active' : 'Inactive';
            $csv .= '"' . str_replace('"', '""', $level->requestType->name ?? '') . '",';
            $csv .= '"' . str_replace('"', '""', $level->name) . '",';
            $csv .= '"' . str_replace('"', '""', $level->description ?? '') . '",';
            $csv .= '"' . $statusText . '",';
            $csv .= '"' . $level->created_at->format('Y-m-d H:i:s') . '"' . "\n";
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="access_levels_export.csv"');
    }

    /**
     * Get access levels by request type ID (for dependent dropdown)
     */
    public function byRequestType(string $requestTypeId)
    {
        $accessLevels = AccessLevel::where('request_type_id', $requestTypeId)
            ->where('status', 1)
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $accessLevels,
        ]);
    }
}
