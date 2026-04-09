<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update any existing 'reassigned' records to 'assigned'
        DB::table('ticket_tracks')
            ->where('action', 'reassigned')
            ->update(['action' => 'assigned']);
        
        // Then update action enum: remove 'reassigned', add 'started' and 'resolved'
        DB::statement("ALTER TABLE ticket_tracks MODIFY COLUMN action ENUM('created', 'updated', 'status_changed', 'comment', 'assigned', 'started', 'resolved', 'closed', 'reopened')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to previous enum values
        DB::statement("ALTER TABLE ticket_tracks MODIFY COLUMN action ENUM('created', 'updated', 'status_changed', 'comment', 'assigned', 'reassigned', 'closed', 'reopened')");
    }
};
