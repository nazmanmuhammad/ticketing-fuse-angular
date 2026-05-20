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
            
            // Requester Information (sama seperti ticket)
            $table->enum('requester_type', ['select_employee', 'by_input'])->nullable();
            $table->uuid('requester_id')->nullable(); // User ID from users table
            $table->string('name')->nullable(); // Full name (sama seperti ticket: 'name')
            $table->string('email')->nullable();
            $table->string('phone_number')->nullable(); // Sama seperti ticket
            $table->string('extension_number')->nullable();
            $table->foreignUuid('department_id')->nullable();
            
            // Access Request Details
            $table->string('resource_name'); // System/Resource name
            $table->string('request_type')->nullable(); // Free text field
            $table->string('access_level')->nullable(); // Free text field
            $table->text('reason'); // Justification
            
            // Duration
            $table->enum('duration_type', ['Temporary Access', 'Permanent Access']);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            
            // Assignment (sama seperti ticket)
            $table->enum('assign_status', ['member', 'team'])->default('member'); // Sama seperti ticket
            $table->uuid('team_id')->nullable(); // Sama seperti ticket (bukan assign_to_team_id)
            $table->uuid('pic_technical_id')->nullable(); // Sama seperti ticket (bukan assign_to_user_id)
            $table->uuid('pic_helpdesk_id')->nullable(); // Sama seperti ticket
            
            // Status & Priority
            $table->integer('status')->default(0); // 0=Pending, 1=Approved, 2=Rejected, 3=Provisioned
            $table->integer('priority')->default(0); // 0=Low, 1=Medium, 2=High, 3=Critical (sama seperti ticket)
            
            // Response & Notes (sama seperti ticket)
            $table->text('response')->nullable();
            $table->text('internal_note')->nullable();
            $table->boolean('mark_internal')->default(false);
            
            // Options & Approval (sama seperti ticket)
            $table->boolean('approval_required')->default(false);
            $table->boolean('close_on_response')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('set null');
            $table->foreign('pic_technical_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('pic_helpdesk_id')->references('id')->on('users')->onDelete('set null');
            
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