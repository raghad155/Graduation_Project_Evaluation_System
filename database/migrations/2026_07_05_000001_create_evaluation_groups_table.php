<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * تشغيل الهجرة لإنشاء جدول مجموعات التقييم.
     */
    public function up(): void
    {
        Schema::create('evaluation_groups', function (Blueprint $table) {
            $table->id(); // المعرف الفريد للمجموعة
            $table->string('title'); // عنوان مجموعة التقييم (مثال: التقييم الفني، المهارات البرمجية)
            $table->text('description')->nullable(); // وصف للمجموعة ومعاييرها اختياري
            $table->integer('weight'); // الوزن النسبي للمجموعة بالدرجات أو النسبة
            $table->timestamps(); // تاريخ الإنشاء والتحديث
        });
    }

    /**
     * التراجع عن الهجرة وحذف الجدول.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluation_groups');
    }
};
