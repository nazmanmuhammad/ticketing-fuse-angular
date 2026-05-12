<?php

namespace Database\Seeders;

use App\Models\TicketSource;
use Illuminate\Database\Seeder;

class TicketSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sources = [
            [
                'name' => 'Email',
                'description' => 'Tickets created from email submissions',
                'status' => 1,
            ],
            [
                'name' => 'Web Portal',
                'description' => 'Tickets created through the web application',
                'status' => 1,
            ],
            [
                'name' => 'Phone Call',
                'description' => 'Tickets created from phone call requests',
                'status' => 1,
            ],
            [
                'name' => 'WhatsApp',
                'description' => 'Tickets created from WhatsApp messages',
                'status' => 1,
            ],
            [
                'name' => 'Walk-in',
                'description' => 'Tickets created from in-person visits',
                'status' => 1,
            ],
        ];

        foreach ($sources as $source) {
            TicketSource::create($source);
        }
    }
}
