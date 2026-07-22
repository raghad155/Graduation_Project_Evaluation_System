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
        Schema::table('specializations', function (Blueprint $table) {
            $table->string('name_ar')->after('id')->nullable();
            $table->string('name_en')->after('name_ar')->nullable();
            
            // To ensure compatibility during upgrade
            if (Schema::hasColumn('specializations', 'name')) {
                // Populate new columns from old, if you wish, or just drop it. For now, we drop it.
                $table->dropColumn('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('specializations', function (Blueprint $table) {
            //
        });
    }
};
