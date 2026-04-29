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
        Schema::create('access_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('request_number')->unique(); // AR-2026-0001
            
            // Requester Information
            $table->uuid('requester_id'); // User ID from users table
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('department');
            
            // Access Request Details
            $table->string('resource_name'); // System/Resource name
            $table->enum('request_type', ['New Access', 'Change Access', 'Revoke Access']);
            $table->enum('access_level', ['Viewer', 'Standard User', 'Editor', 'Admin Access']);
            $table->text('reason'); // Justification
            
            // Duration
            $table->enum('duration_type', ['Temporary Access', 'Permanent Access']);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            
            // Assignment
            $table->enum('assign_type', ['member', 'team'])->default('member');
            $table->uuid('assign_to_user_id')->nullable(); // If assigned to member
            $table->uuid('assign_to_team_id')->nullable(); // If assigned to team
            
            // Status & Priority
            $table->integer('status')->default(0); // 0=Pending, 1=Approved, 2=Rejected, 3=Provisioned
            $table->integer('priority')->nullable(); // 0=Low, 1=Medium, 2=High, 3=Critical
            
            // Options
            $table->boolean('notify_requester')->default(false);
            $table->boolean('require_manager_approval')->default(false);
            
            // Approval
            $table->boolean('approval_required')->default(false);
            $table->json('approver_ids')->nullable(); // Array of user IDs with levels
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('requester_id');
            $table->index('status');
            $table->index('request_number');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_requests');
    }
};