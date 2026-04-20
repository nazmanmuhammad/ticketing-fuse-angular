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
        // Update status column to allow -1 for draft status
        // MySQL doesn't have a direct way to modify enum, so we'll use ALTER TABLE
        DB::statement("ALTER TABLE tickets MODIFY COLUMN status INT DEFAULT 0");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back if needed
        DB::statement("ALTER TABLE tickets MODIFY COLUMN status INT DEFAULT 0");
    }
};
