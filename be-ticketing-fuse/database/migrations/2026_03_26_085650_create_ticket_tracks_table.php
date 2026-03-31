<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ticket_tracks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ticket_id');
            $table->foreignUuid('user_id');
            $table->enum('action', ['created', 'status_changed', 'comment', 'assigned', 'closed', 'reopened']);
            $table->string('description');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_tracks');
    }
};
