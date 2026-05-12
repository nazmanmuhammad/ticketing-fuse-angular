<?php

namespace Database\Seeders;

use App\Models\HelpTopic;
use Illuminate\Database\Seeder;

class HelpTopicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $topics = [
            [
                'name' => 'Hardware Issue',
                'description' => 'Problems related to computer hardware, peripherals, and physical equipment',
                'status' => 1,
            ],
            [
                'name' => 'Software Issue',
                'description' => 'Issues with software applications, installations, and updates',
                'status' => 1,
            ],
            [
                'name' => 'Network Issue',
                'description' => 'Network connectivity, internet access, and network configuration problems',
                'status' => 1,
            ],
            [
                'name' => 'Account Access',
                'description' => 'Login issues, password resets, and account permissions',
                'status' => 1,
            ],
            [
                'name' => 'Email Issue',
                'description' => 'Email configuration, sending/receiving problems, and email client issues',
                'status' => 1,
            ],
            [
                'name' => 'Printer Issue',
                'description' => 'Printer connectivity, printing quality, and printer driver problems',
                'status' => 1,
            ],
            [
                'name' => 'System Performance',
                'description' => 'Slow system performance, freezing, and optimization requests',
                'status' => 1,
            ],
            [
                'name' => 'Data Backup & Recovery',
                'description' => 'Data backup requests, file recovery, and data restoration',
                'status' => 1,
            ],
            [
                'name' => 'Security Concern',
                'description' => 'Security threats, virus/malware issues, and security policy questions',
                'status' => 1,
            ],
            [
                'name' => 'New Request',
                'description' => 'New equipment requests, software installation requests, and access requests',
                'status' => 1,
            ],
        ];

        foreach ($topics as $topic) {
            HelpTopic::create($topic);
        }
    }
}
