<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

Route::get('/', function () {
    // \Log::info('Test mail sent');
    // Mail::to('nurulazman2002@gmail.com')->send(new \App\Mail\TestMail());
    return view('welcome');
});

Route::get('testing', function() {
    $url = "https://back.siglab.co.id/api/digitalization/get-testing-master";
    
    // Cache for 1 hour (3600 seconds)
    $data = Cache::remember('testing_master_grouped', 3600, function() use ($url) {
        try {
            // Fetch data from external API
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                return [
                    'status' => false,
                    'message' => 'Failed to fetch data from external API',
                    'data' => []
                ];
            }
            
            $rawData = $response->json();
            
            // Group by matrix_name
            $grouped = collect($rawData)->groupBy('matrix_name')->map(function($items, $matrixName) {
                return [
                    'matrix_name' => $matrixName,
                    'matrix_eng' => $items->first()['matrix_eng'] ?? null,
                    'matrix_form' => $items->first()['matrix_form'] ?? null,
                    'matrix_type' => $items->first()['matrix_type'] ?? null,
                    'items' => $items->map(function($item) {
                        // Remove matrix fields from items to avoid duplication
                        return collect($item)->except([
                            'matrix_name', 
                            'matrix_eng', 
                            'matrix_form', 
                            'matrix_type',
                            'matrix_reference'
                        ])->toArray();
                    })->values()->toArray()
                ];
            })->values()->toArray();
            
            return [
                'status' => true,
                'message' => 'Data retrieved successfully',
                'data' => $grouped,
                'cached_at' => now()->toDateTimeString()
            ];
            
        } catch (\Exception $e) {
            \Log::error('Testing API Error: ' . $e->getMessage());
            return [
                'status' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'data' => []
            ];
        }
    });
    
    return response()->json($data);
});
