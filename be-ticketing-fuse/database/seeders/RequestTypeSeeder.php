<?php

namespace Database\Seeders;

use App\Models\RequestType;
use Illuminate\Database\Seeder;

class RequestTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $requestTypes = [
            [
                'name' => 'New Access',
                'description' => 'Request for new system or application access',
                'status' => 1,
            ],
            [
                'name' => 'Change Access',
                'description' => 'Request to modify existing access permissions',
                'status' => 1,
            ],
            [
                'name' => 'Revoke Access',
                'description' => 'Request to remove or revoke access permissions',
                'status' => 1,
            ],
        ];

        foreach ($requestTypes as $type) {
            RequestType::create($type);
        }
    }
}
