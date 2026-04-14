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
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ticket_number');
            $table->enum('requester_type', ['select_employee', 'by_input'])->nullable();
            $table->foreignUuid('requester_id')->nullable();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('extension_number')->nullable();
            $table->string('ticket_source');
            $table->foreignUuid('department_id')->nullable();
            $table->string('help_topic');
            $table->string('subject_issue');
            $table->text('issue_detail');
            $table->integer('priority')->default(0);
            $table->enum('assign_status', ['member', 'team']);
            $table->foreignUuid('team_id')->nullable();
            $table->foreignUuid('pic_technical_id')->nullable();
            $table->string('pic_helpdesk_id')->nullable();
            $table->integer('status')->default(0);
            $table->datetime('start_date')->nullable();
            $table->datetime('end_date')->nullable();
            
            // Response & Notes fields
            $table->text('response')->nullable();
            $table->text('internal_note')->nullable();
            $table->boolean('mark_internal')->default(false);
            
            // Approval & Close fields
            $table->boolean('approval_required')->default(false);
            $table->boolean('close_on_response')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
