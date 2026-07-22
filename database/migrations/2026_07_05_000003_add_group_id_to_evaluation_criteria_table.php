<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * تشغيل الهجرة لتعديل جدول معايير التقييم وربطه بمجموعة التقييم.
     */
    public function up(): void
    {
        Schema::table('evaluation_criteria', function (Blueprint $table) {
            // إضافة حقل الربط بمجموعة التقييم
            $table->foreignId('group_id')
                  ->nullable()
                  ->constrained('evaluation_groups')
                  ->nullOnDelete();

            // إذا كان حقل project_id موجوداً (مثل بيئة الاختبارات)، نجعله nullable
            if (Schema::hasColumn('evaluation_criteria', 'project_id')) {
                $table->unsignedBigInteger('project_id')->nullable()->change();
            }
        });
    }

    /**
     * التراجع عن الهجرة وإزالة الحقول المضافة.
     */
    public function down(): void
    {
        Schema::table('evaluation_criteria', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropColumn('group_id');
        });
    }
};
