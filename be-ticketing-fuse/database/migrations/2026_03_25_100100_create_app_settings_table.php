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
        Schema::create('app_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('app_name')->nullable();
            $table->string('app_title')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('favicon_url')->nullable();
            $table->string('favicon_path')->nullable();

            $table->string('smtp_host')->nullable();
            $table->unsignedInteger('smtp_port')->nullable();
            $table->string('smtp_encryption')->nullable();
            $table->string('smtp_username')->nullable();
            $table->string('smtp_password')->nullable();
            $table->string('smtp_from_name')->nullable();
            $table->string('smtp_from_email')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
