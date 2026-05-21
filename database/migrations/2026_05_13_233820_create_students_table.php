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
       Schema::create('students', function (Blueprint $table) {
    $table->id();

    $table->string('full_name');
    $table->foreignId('user_id')
          ->constrained()
          ->cascadeOnDelete();

    $table->string('academic_number')->unique();

    $table->foreignId('specialization_id')
        ->constrained('specializations')
        ->cascadeOnDelete();

    $table->foreignId('project_id')
        ->nullable()
        ->constrained('projects')
        ->nullOnDelete();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
