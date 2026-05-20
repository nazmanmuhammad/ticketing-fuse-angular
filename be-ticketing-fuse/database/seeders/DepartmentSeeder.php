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
            // Check if department already exists
            $exists = Department::where('name', $dept['name'])->first();
            
            if (!$exists) {
                // Create new department (this will trigger UUID generation)
                Department::create([
                    'name' => $dept['name'],
                    'description' => $dept['description']
                ]);
            }
        }
    }
}
