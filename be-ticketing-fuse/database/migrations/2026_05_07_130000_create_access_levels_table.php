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
        Schema::create('access_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('request_type_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->tinyInteger('status')->default(1)->comment('0=Inactive, 1=Active');
            $table->timestamps();

            $table->foreign('request_type_id')
                  ->references('id')
                  ->on('request_types')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_levels');
    }
};
