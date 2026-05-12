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
        // Prepare data with extracted fields from HRIS payload
        $data = $request->all();
        
        // Extract phone_number from 'phone' field if exists
        if (isset($data['phone']) && !isset($data['phone_number'])) {
            $data['phone_number'] = $data['phone'];
            unset($data['phone']);
        }
        
        // Extract division from 'division_name' if exists
        if (isset($data['division_name']) && !isset($data['division'])) {
            $data['division'] = $data['division_name'];
        }
        
        // Extract position from 'position.position_name' if exists
        if (isset($data['position']) && is_array($data['position']) && isset($data['position']['position_name'])) {
            $data['position'] = $data['position']['position_name'];
        }
        
        $item = User::create($data);
        \Log::info('User created with data:', $data);

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
        
        // Prepare data with extracted fields from HRIS payload
        $data = $request->all();
        
        // Extract phone_number from 'phone' field if exists
        if (isset($data['phone']) && !isset($data['phone_number'])) {
            $data['phone_number'] = $data['phone'];
            unset($data['phone']);
        }
        
        // Extract division from 'division_name' if exists
        if (isset($data['division_name']) && !isset($data['division'])) {
            $data['division'] = $data['division_name'];
        }
        
        // Extract position from 'position.position_name' if exists
        if (isset($data['position']) && is_array($data['position']) && isset($data['position']['position_name'])) {
            $data['position'] = $data['position']['position_name'];
        }
        
        $item->update($data);
        \Log::info('User updated with data:', $data);

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

    public function syncFromHris(Request $request)
    {
        try {
            // Get HRIS token from request
            $hrisToken = $request->input('hris_token');
            
            if (!$hrisToken) {
                return response()->json([
                    'status' => false,
                    'message' => 'HRIS token tidak ditemukan. Silakan login ulang.',
                ], 400);
            }
            
            $hrisApiUrl = env('HRIS_API_URL', 'https://back.siglab.co.id');
            $hrisApiUrl = rtrim($hrisApiUrl, '/');
            
            // Check if it ends with /api, if not add it
            if (!str_ends_with($hrisApiUrl, '/api')) {
                $hrisApiUrl .= '/api';
            }
            
            $employeeApiUrl = $hrisApiUrl . '/hris/employee';
            
            $updatedCount = 0;
            $page = 1;
            $hasMorePages = true;
            
            while ($hasMorePages) {
                // Fetch employees from HRIS API with Bearer token
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => 'Bearer ' . $hrisToken,
                ])->post($employeeApiUrl . '?page=' . $page . '&company=1', []);
                
                \Log::info('HRIS API Response', [
                    'page' => $page,
                    'status' => $response->status(),
                    'successful' => $response->successful(),
                ]);
                
                if (!$response->successful()) {
                    \Log::error('HRIS API request failed', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    
                    if ($response->status() === 401) {
                        return response()->json([
                            'status' => false,
                            'message' => 'Token HRIS tidak valid atau sudah expired. Silakan login ulang.',
                        ], 401);
                    }
                    
                    break;
                }
                
                $data = $response->json();
                $employees = $data['data'] ?? [];
                
                \Log::info('HRIS API Data', [
                    'page' => $page,
                    'employees_count' => count($employees),
                    'current_page' => $data['current_page'] ?? null,
                    'last_page' => $data['last_page'] ?? null,
                ]);
                
                if (empty($employees)) {
                    \Log::info('No employees found on page ' . $page);
                    break;
                }
                
                foreach ($employees as $employee) {
                    $hrisUserId = $employee['user_id'] ?? null;
                    
                    if (!$hrisUserId) {
                        continue;
                    }
                    
                    // Find user by hris_user_id (which matches user_id from HRIS)
                    $user = User::where('hris_user_id', $hrisUserId)->first();
                    
                    if ($user) {
                        // Extract data from HRIS
                        $name = $employee['employee_name'] ?? $user->name;
                        $email = $employee['selfupdate']['email_kantor'] ?? $employee['user']['email'] ?? $user->email;
                        $phone = $employee['phone'] ?? null;
                        $division = $employee['bagian']['division_name'] ?? null;
                        $position = $employee['position']['position_name'] ?? null;
                        
                        \Log::info('Updating user', [
                            'hris_user_id' => $hrisUserId,
                            'user_id' => $user->id,
                            'name' => $name,
                            'email' => $email,
                            'phone' => $phone,
                            'division' => $division,
                            'position' => $position,
                        ]);
                        
                        // Update user
                        $user->update([
                            'name' => $name,
                            'email' => $email,
                            'phone_number' => $phone,
                            'division' => $division,
                            'position' => $position,
                        ]);
                        
                        $updatedCount++;
                    } else {
                        \Log::info('User not found for hris_user_id: ' . $hrisUserId);
                    }
                }
                
                // Check if there are more pages
                $currentPage = $data['current_page'] ?? $page;
                $lastPage = $data['last_page'] ?? $page;
                $hasMorePages = $currentPage < $lastPage;
                $page++;
            }
            
            return response()->json([
                'status' => true,
                'message' => "Berhasil sync {$updatedCount} user dari HRIS",
                'data' => [
                    'updated_count' => $updatedCount,
                ],
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error syncing users from HRIS: ' . $e->getMessage());
            
            return response()->json([
                'status' => false,
                'message' => 'Gagal sync data dari HRIS: ' . $e->getMessage(),
            ], 500);
        }
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
