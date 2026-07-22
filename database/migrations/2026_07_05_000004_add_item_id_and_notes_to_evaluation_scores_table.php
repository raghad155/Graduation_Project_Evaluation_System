<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * تشغيل الهجرة لتعديل جدول درجات التقييم بإضافة المعيار الفرعي والملاحظات.
     */
    public function up(): void
    {
        Schema::table('evaluation_scores', function (Blueprint $table) {
            // إضافة حقل الربط ببند التقييم الفرعي (المقياس)
            $table->foreignId('item_id')
                  ->nullable()
                  ->after('criteria_id')
                  ->constrained('evaluation_items')
                  ->nullOnDelete();

            // إضافة حقل الملاحظات لتسجيل الملاحظات المفصلة للتقييم لكل بند
            $table->text('notes')
                  ->nullable()
                  ->after('score');
        });
    }

    /**
     * التراجع عن الهجرة وإزالة الحقول.
     */
    public function down(): void
    {
        Schema::table('evaluation_scores', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
            $table->dropColumn('item_id');
            $table->dropColumn('notes');
        });
    }
};
