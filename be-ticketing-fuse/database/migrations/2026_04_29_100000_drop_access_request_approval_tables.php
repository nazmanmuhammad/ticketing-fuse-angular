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
        // Drop the old access request approval tables
        // Access requests now use the shared approvals table (polymorphic relationship)
        Schema::dropIfExists('access_request_approval_items');
        Schema::dropIfExists('access_request_approvals');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the tables if needed (for rollback)
        Schema::create('access_request_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('access_request_id');
            $table->integer('level')->default(1);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
            
            $table->foreign('access_request_id')
                  ->references('id')
                  ->on('access_requests')
                  ->onDelete('cascade');
        });

        Schema::create('access_request_approval_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('access_request_approval_id');
            $table->uuid('user_id'); // Approver
            $table->integer('level')->default(1);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('access_request_approval_id', 'ar_approval_items_approval_id_foreign')
                  ->references('id')
                  ->on('access_request_approvals')
                  ->onDelete('cascade');
                  
            $table->index('access_request_approval_id', 'ar_approval_items_approval_id_index');
            $table->index('user_id');
            $table->index('status');
        });
    }
};
