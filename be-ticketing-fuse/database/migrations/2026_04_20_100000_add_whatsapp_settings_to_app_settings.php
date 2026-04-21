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
        Schema::table('app_settings', function (Blueprint $table) {
            $table->string('whatsapp_url')->nullable()->after('smtp_from_email');
            $table->string('whatsapp_key')->nullable()->after('whatsapp_url');
            $table->text('whatsapp_footer')->nullable()->after('whatsapp_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('app_settings', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_url', 'whatsapp_key', 'whatsapp_footer']);
        });
    }
};
