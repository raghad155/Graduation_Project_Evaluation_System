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
       Schema::create('evaluation_scores', function (Blueprint $table) {

    $table->id();

      $table->foreignId('student_id')
          ->constrained()
          ->onDelete('cascade');

    $table->foreignId('evaluation_id')
          ->constrained()
          ->onDelete('cascade');

    $table->foreignId('criteria_id')
          ->constrained('evaluation_criteria')
          ->onDelete('cascade');

    $table->integer('score');

    $table->timestamps();

});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluation_scores');
    }
};
