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
    {Schema::create('projects', function (Blueprint $table) {
    $table->id();
    
    $table->string('title');
    $table->text('description');

    $table->foreignId('specialization_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->foreignId('supervisor_id')
        ->constrained('users')
        ->cascadeOnDelete();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
