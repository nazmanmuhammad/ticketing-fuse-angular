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
        Schema::create('access_request_tracks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('access_request_id');
            $table->uuid('user_id')->nullable();
            $table->enum('action', [
                'created',
                'updated',
                'approved',
                'rejected',
                'provisioned',
                'assigned',
                'reassigned',
                'commented'
            ]);
            $table->text('description');
            $table->json('metadata')->nullable(); // Additional data
            $table->timestamps();
            
            $table->foreign('access_request_id')
                  ->references('id')
                  ->on('access_requests')
                  ->onDelete('cascade');
                  
            $table->index('access_request_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_request_tracks');
    }
};