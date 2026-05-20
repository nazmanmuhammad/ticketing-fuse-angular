<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TestingMasterExport;

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
    
    // Return blade view instead of JSON
    return view('testing-master', ['data' => $data]);
});

// Optional: Keep JSON endpoint for API access
Route::get('testing/json', function() {
    $url = "https://back.siglab.co.id/api/digitalization/get-testing-master";
    
    $data = Cache::remember('testing_master_grouped', 3600, function() use ($url) {
        try {
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                return [
                    'status' => false,
                    'message' => 'Failed to fetch data from external API',
                    'data' => []
                ];
            }
            
            $rawData = $response->json();
            
            $grouped = collect($rawData)->groupBy('matrix_name')->map(function($items, $matrixName) {
                return [
                    'matrix_name' => $matrixName,
                    'matrix_eng' => $items->first()['matrix_eng'] ?? null,
                    'matrix_form' => $items->first()['matrix_form'] ?? null,
                    'matrix_type' => $items->first()['matrix_type'] ?? null,
                    'items' => $items->map(function($item) {
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

// Export to Excel
Route::get('testing/export', function() {
    $url = "https://back.siglab.co.id/api/digitalization/get-testing-master";
    
    $data = Cache::remember('testing_master_grouped', 3600, function() use ($url) {
        try {
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                return [
                    'status' => false,
                    'message' => 'Failed to fetch data from external API',
                    'data' => []
                ];
            }
            
            $rawData = $response->json();
            
            $grouped = collect($rawData)->groupBy('matrix_name')->map(function($items, $matrixName) {
                return [
                    'matrix_name' => $matrixName,
                    'matrix_eng' => $items->first()['matrix_eng'] ?? null,
                    'matrix_form' => $items->first()['matrix_form'] ?? null,
                    'matrix_type' => $items->first()['matrix_type'] ?? null,
                    'items' => $items->map(function($item) {
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
    
    if (!$data['status'] || empty($data['data'])) {
        return redirect()->back()->with('error', 'No data available to export');
    }
    
    $filename = 'testing-master-' . date('Y-m-d-His') . '.xlsx';
    
    return Excel::download(new TestingMasterExport($data['data']), $filename);
});

// ============================================
// Email Preview Routes
// ============================================

// Preview: Ticket Created Email
Route::get('/preview-email/ticket-created', function () {
    $appSettings = \App\Models\AppSetting::first();
    
    $ticket = (object) [
        'id' => 'abc123-def456-ghi789',
        'ticket_number' => 'TKT-2026-001234',
        'subject_issue' => 'Network Connection Issue in Building A',
        'issue_detail' => 'The network connection in Building A, Floor 3 has been intermittent since this morning. Multiple users are experiencing slow internet speeds and frequent disconnections. This is affecting productivity and urgent work needs to be completed.',
        'name' => 'Sarah Anderson',
        'help_topic' => 'Network & Infrastructure',
        'priority' => 4, // Critical
        'created_at' => now()->subHours(2),
        'end_date' => null,
        'requester' => (object) [
            'division' => 'IT Operations'
        ]
    ];
    
    $recipientName = 'John Smith';
    
    return view('emails.ticket-created', compact('ticket', 'recipientName', 'appSettings'));
});

// Preview: Ticket Requester Email (for requester who created the ticket)
Route::get('/preview-email/ticket-requester', function () {
    $appSettings = \App\Models\AppSetting::first();
    
    $ticket = (object) [
        'id' => 'abc123-def456-ghi789',
        'ticket_number' => 'TKT-2026-001234',
        'subject_issue' => 'Network Connection Issue in Building A',
        'issue_detail' => 'The network connection in Building A, Floor 3 has been intermittent since this morning. Multiple users are experiencing slow internet speeds and frequent disconnections. This is affecting productivity and urgent work needs to be completed.',
        'name' => 'Sarah Anderson',
        'help_topic' => 'Network & Infrastructure',
        'priority' => 4, // Critical
        'created_at' => now()->subHours(2),
        'end_date' => null,
        'requester' => (object) [
            'division' => 'IT Operations'
        ]
    ];
    
    $recipientName = 'Sarah Anderson';
    
    return view('emails.ticket-requester', compact('ticket', 'recipientName', 'appSettings'));
});

// Preview: Ticket Assigned Email
Route::get('/preview-email/ticket-assigned', function () {
    $appSettings = \App\Models\AppSetting::first();
    
    $ticket = (object) [
        'id' => 'abc123-def456-ghi789',
        'ticket_number' => 'TKT-2026-001235',
        'subject_issue' => 'Software Installation Request - Adobe Creative Suite',
        'issue_detail' => 'Need Adobe Creative Suite installed on workstation for graphic design work. License is already available.',
        'name' => 'Michael Chen',
        'help_topic' => 'Software & Applications',
        'priority' => 2, // Medium
        'created_at' => now()->subMinutes(30),
        'end_date' => null,
        'requester' => (object) [
            'division' => 'Marketing Department'
        ]
    ];
    
    $recipientName = 'Emily Rodriguez';
    
    return view('emails.ticket-assigned', compact('ticket', 'recipientName', 'appSettings'));
});

// Preview: Ticket Team Assigned Email
Route::get('/preview-email/ticket-team-assigned', function () {
    $appSettings = \App\Models\AppSetting::first();
    
    $ticket = (object) [
        'id' => 'xyz789-abc123-def456',
        'ticket_number' => 'TKT-2026-001236',
        'subject_issue' => 'Database Performance Optimization Required',
        'issue_detail' => 'The main database server is experiencing slow query performance during peak hours. Need optimization and performance tuning.',
        'name' => 'David Thompson',
        'help_topic' => 'Database & Servers',
        'priority' => 3, // High
        'created_at' => now()->subHours(1),
        'end_date' => null,
        'requester' => (object) [
            'division' => 'Development Team'
        ],
        'team' => (object) [
            'name' => 'Database Administration Team'
        ]
    ];
    
    $recipientName = 'Alex Johnson';
    
    return view('emails.ticket-team-assigned', compact('ticket', 'recipientName', 'appSettings'));
});

// Preview: Ticket Resolved Email
Route::get('/preview-email/ticket-resolved', function () {
    $appSettings = \App\Models\AppSetting::first();
    
    $ticket = (object) [
        'id' => 'def456-ghi789-jkl012',
        'ticket_number' => 'TKT-2026-001237',
        'subject_issue' => 'Email Account Access Issue',
        'issue_detail' => 'Unable to access email account after password reset. Getting authentication error.',
        'name' => 'Jennifer Williams',
        'help_topic' => 'Email & Communication',
        'priority' => 2, // Medium
        'created_at' => now()->subDays(1),
        'end_date' => null,
        'response' => 'The email account has been successfully restored. The issue was caused by a synchronization problem with the mail server. We have reset the account credentials and verified that you can now access your email normally. Please try logging in with your current password.',
        'requester' => (object) [
            'division' => 'Human Resources'
        ],
        'pic_technical' => (object) [
            'name' => 'Robert Martinez',
            'division' => 'IT Support Team'
        ]
    ];
    
    $recipientName = 'Jennifer Williams';
    
    return view('emails.ticket-resolved', compact('ticket', 'recipientName', 'appSettings'));
});

// Preview: Comment Feedback Email
Route::get('/preview-email/comment-feedback', function () {
    $appSettings = \App\Models\AppSetting::first();
    
    $ticket = (object) [
        'id' => 'ghi789-jkl012-mno345',
        'ticket_number' => 'TKT-2026-001238',
        'subject_issue' => 'Printer Not Working in Conference Room B',
        'help_topic' => 'Hardware & Equipment',
        'status' => 1, // Processing
    ];
    
    $comment = (object) [
        'comment' => 'I have checked the printer and found that it was out of paper and the toner cartridge needs replacement. I have refilled the paper tray. The new toner cartridge will arrive tomorrow morning. The printer should be fully operational by 10 AM tomorrow.',
        'created_at' => now()->subMinutes(15),
        'user' => (object) [
            'name' => 'Kevin Brown'
        ]
    ];
    
    $recipientName = 'Lisa Anderson';
    
    return view('emails.comment-feedback', compact('ticket', 'comment', 'recipientName', 'appSettings'));
});

// Preview: All Emails Index
Route::get('/preview-email', function () {
    return view('email-preview-index');
});


// Preview: Access Request Created Email
Route::get('/preview-email/access-request-created', function () {
    $accessRequest = \App\Models\AccessRequest::with(['requester', 'department', 'picTechnical', 'team'])->first();
    $appSettings = \App\Models\AppSetting::first();
    
    if (!$accessRequest) {
        return 'No access request found. Please create one first.';
    }
    
    return view('emails.access-request-created', [
        'accessRequest' => $accessRequest,
        'appSettings' => $appSettings,
    ]);
});

// Preview: Access Request Assigned Email
Route::get('/preview-email/access-request-assigned', function () {
    $accessRequest = \App\Models\AccessRequest::with(['requester', 'department', 'picTechnical', 'team'])->first();
    $appSettings = \App\Models\AppSetting::first();
    
    if (!$accessRequest) {
        return 'No access request found. Please create one first.';
    }
    
    return view('emails.access-request-assigned', [
        'accessRequest' => $accessRequest,
        'appSettings' => $appSettings,
    ]);
});

// Preview: Access Request Team Assigned Email
Route::get('/preview-email/access-request-team-assigned', function () {
    $accessRequest = \App\Models\AccessRequest::with(['requester', 'department', 'picTechnical', 'team'])->first();
    $appSettings = \App\Models\AppSetting::first();
    
    if (!$accessRequest) {
        return 'No access request found. Please create one first.';
    }
    
    return view('emails.access-request-team-assigned', [
        'accessRequest' => $accessRequest,
        'appSettings' => $appSettings,
    ]);
});
