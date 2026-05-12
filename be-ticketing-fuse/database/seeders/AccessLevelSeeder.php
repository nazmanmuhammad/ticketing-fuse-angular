<?php

namespace Database\Seeders;

use App\Models\AccessLevel;
use App\Models\RequestType;
use Illuminate\Database\Seeder;

class AccessLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get request types
        $newAccess = RequestType::where('name', 'New Access')->first();
        $changeAccess = RequestType::where('name', 'Change Access')->first();
        $revokeAccess = RequestType::where('name', 'Revoke Access')->first();

        $accessLevels = [
            // New Access levels
            [
                'request_type_id' => $newAccess->id,
                'name' => 'Read Only',
                'description' => 'View-only access to the system',
                'status' => 1,
            ],
            [
                'request_type_id' => $newAccess->id,
                'name' => 'Standard User',
                'description' => 'Standard user access with basic permissions',
                'status' => 1,
            ],
            [
                'request_type_id' => $newAccess->id,
                'name' => 'Power User',
                'description' => 'Advanced user access with extended permissions',
                'status' => 1,
            ],
            [
                'request_type_id' => $newAccess->id,
                'name' => 'Administrator',
                'description' => 'Full administrative access',
                'status' => 1,
            ],
            // Change Access levels
            [
                'request_type_id' => $changeAccess->id,
                'name' => 'Upgrade Access',
                'description' => 'Increase access level permissions',
                'status' => 1,
            ],
            [
                'request_type_id' => $changeAccess->id,
                'name' => 'Downgrade Access',
                'description' => 'Decrease access level permissions',
                'status' => 1,
            ],
            [
                'request_type_id' => $changeAccess->id,
                'name' => 'Modify Permissions',
                'description' => 'Change specific permissions without level change',
                'status' => 1,
            ],
            // Revoke Access levels
            [
                'request_type_id' => $revokeAccess->id,
                'name' => 'Temporary Suspension',
                'description' => 'Temporarily suspend access',
                'status' => 1,
            ],
            [
                'request_type_id' => $revokeAccess->id,
                'name' => 'Permanent Revocation',
                'description' => 'Permanently remove all access',
                'status' => 1,
            ],
            [
                'request_type_id' => $revokeAccess->id,
                'name' => 'Partial Revocation',
                'description' => 'Remove specific access permissions',
                'status' => 1,
            ],
        ];

        foreach ($accessLevels as $level) {
            AccessLevel::create($level);
        }
    }
}
