<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * تشغيل الهجرة لإنشاء جدول بنود التقييم الفرعية (المقاييس الأربعة).
     */
    public function up(): void
    {
        Schema::create('evaluation_items', function (Blueprint $table) {
            $table->id(); // المعرف الفريد للبند الفرعي
            
            // الربط بجدول معايير التقييم كعلاقة تتبع (كل بند ينتمي لمعيار محدد)
            $table->foreignId('criteria_id')
                  ->constrained('evaluation_criteria')
                  ->cascadeOnDelete();

            $table->string('title'); // عنوان البند الفرعي (مثال: ممتاز، جيد جداً، متوسط، ضعيف)
            $table->text('description')->nullable(); // شرح تفصيلي للبند وشروطه
            $table->integer('max_score'); // الدرجة القصوى المطابقة لهذا المقاس (مثلاً 25% أو 50% أو 75% أو 100% من وزن المعيار)
            $table->timestamps(); // تاريخ الإنشاء والتحديث
        });
    }

    /**
     * التراجع عن الهجرة وحذف الجدول.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluation_items');
    }
};
