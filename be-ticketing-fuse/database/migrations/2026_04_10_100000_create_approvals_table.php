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
        // Parent table: approval requests
        Schema::create('approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('approvable'); // approvable_id, approvable_type (polymorphic)
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->foreignUuid('requested_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // Child table: approval items (individual approvers)
        Schema::create('approval_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('approval_id')->constrained('approvals')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('level')->default(1);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            // Prevent duplicate approvers in same approval
            $table->unique(['approval_id', 'user_id'], 'approval_items_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_items');
        Schema::dropIfExists('approvals');
    }
};
