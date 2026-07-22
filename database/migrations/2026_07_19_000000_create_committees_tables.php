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
        // 1. جدول اللجان
        Schema::create('committees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // 2. الجدول الوسيط (Many-to-Many)
        Schema::create('committee_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('committee_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // 3. إضافة لجنة لجدول المشاريع
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('committee_id')->nullable()->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['committee_id']);
            $table->dropColumn('committee_id');
        });

        Schema::dropIfExists('committee_user');
        Schema::dropIfExists('committees');
    }
};
