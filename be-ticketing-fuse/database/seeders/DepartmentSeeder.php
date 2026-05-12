<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['name' => 'IT', 'description' => 'Information Technology'],
            ['name' => 'HR', 'description' => 'Human Resources'],
            ['name' => 'Finance', 'description' => 'Finance Department'],
            ['name' => 'Operations', 'description' => 'Operations Department'],
            ['name' => 'Sales', 'description' => 'Sales Department'],
            ['name' => 'Marketing', 'description' => 'Marketing Department'],
            ['name' => 'Support', 'description' => 'Customer Support'],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(
                ['name' => $dept['name']],
                ['description' => $dept['description']]
            );
        }
    }
}
