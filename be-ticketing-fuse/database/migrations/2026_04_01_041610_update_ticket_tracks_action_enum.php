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
        // For MySQL, we need to alter the enum column
        DB::statement("ALTER TABLE ticket_tracks MODIFY COLUMN action ENUM('created', 'updated', 'status_changed', 'comment', 'assigned', 'closed', 'reopened')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE ticket_tracks MODIFY COLUMN action ENUM('created', 'status_changed', 'comment', 'assigned', 'closed', 'reopened')");
    }
};