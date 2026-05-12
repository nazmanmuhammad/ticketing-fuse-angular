<?php

namespace App\Http\Controllers;

use App\Models\HelpTopic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HelpTopicController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = HelpTopic::query();

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

        $helpTopics = $query->paginate($perPage);

        return response()->json([
            'data' => $helpTopics->items(),
            'meta' => [
                'current_page' => $helpTopics->currentPage(),
                'last_page' => $helpTopics->lastPage(),
                'per_page' => $helpTopics->perPage(),
                'total' => $helpTopics->total(),
                'from' => $helpTopics->firstItem(),
                'to' => $helpTopics->lastItem(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
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

        $helpTopic = HelpTopic::create($request->only(['name', 'description', 'status']));

        return response()->json([
            'message' => 'Help topic created successfully',
            'data' => $helpTopic,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $helpTopic = HelpTopic::findOrFail($id);

        return response()->json([
            'data' => $helpTopic,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $helpTopic = HelpTopic::findOrFail($id);

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

        $helpTopic->update($request->only(['name', 'description', 'status']));

        return response()->json([
            'message' => 'Help topic updated successfully',
            'data' => $helpTopic,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $helpTopic = HelpTopic::findOrFail($id);
        $helpTopic->delete();

        return response()->json([
            'message' => 'Help topic deleted successfully',
        ]);
    }

    /**
     * Export help topics to CSV.
     */
    public function export(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = HelpTopic::query();

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

        $helpTopics = $query->get();

        $csv = "Name,Description,Status,Created At\n";
        foreach ($helpTopics as $topic) {
            $statusText = $topic->status == 1 ? 'Active' : 'Inactive';
            $csv .= '"' . str_replace('"', '""', $topic->name) . '",';
            $csv .= '"' . str_replace('"', '""', $topic->description ?? '') . '",';
            $csv .= '"' . $statusText . '",';
            $csv .= '"' . $topic->created_at->format('Y-m-d H:i:s') . '"' . "\n";
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="help_topics_export.csv"');
    }
}
