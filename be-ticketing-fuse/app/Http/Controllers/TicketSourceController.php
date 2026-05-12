<?php

namespace App\Http\Controllers;

use App\Models\TicketSource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TicketSourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = TicketSource::query();

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

        $ticketSources = $query->paginate($perPage);

        return response()->json([
            'data' => $ticketSources->items(),
            'meta' => [
                'current_page' => $ticketSources->currentPage(),
                'last_page' => $ticketSources->lastPage(),
                'per_page' => $ticketSources->perPage(),
                'total' => $ticketSources->total(),
                'from' => $ticketSources->firstItem(),
                'to' => $ticketSources->lastItem(),
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

        $ticketSource = TicketSource::create($request->only(['name', 'description', 'status']));

        return response()->json([
            'message' => 'Ticket source created successfully',
            'data' => $ticketSource,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $ticketSource = TicketSource::findOrFail($id);

        return response()->json([
            'data' => $ticketSource,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $ticketSource = TicketSource::findOrFail($id);

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

        $ticketSource->update($request->only(['name', 'description', 'status']));

        return response()->json([
            'message' => 'Ticket source updated successfully',
            'data' => $ticketSource,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $ticketSource = TicketSource::findOrFail($id);
        $ticketSource->delete();

        return response()->json([
            'message' => 'Ticket source deleted successfully',
        ]);
    }

    /**
     * Export ticket sources to CSV.
     */
    public function export(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $query = TicketSource::query();

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

        $ticketSources = $query->get();

        $csv = "Name,Description,Status,Created At\n";
        foreach ($ticketSources as $source) {
            $statusText = $source->status == 1 ? 'Active' : 'Inactive';
            $csv .= '"' . str_replace('"', '""', $source->name) . '",';
            $csv .= '"' . str_replace('"', '""', $source->description ?? '') . '",';
            $csv .= '"' . $statusText . '",';
            $csv .= '"' . $source->created_at->format('Y-m-d H:i:s') . '"' . "\n";
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="ticket_sources_export.csv"');
    }
}
