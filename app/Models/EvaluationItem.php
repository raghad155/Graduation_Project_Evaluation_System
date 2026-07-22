<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationItem extends Model
{
    /**
     * جدول قواعد بنود التقييم الفرعية (المقاييس).
     */
    protected $table = 'evaluation_items';

    /**
     * الحقول القابلة للتعبئة الجماعية.
     */
    protected $fillable = [
        'criteria_id', // ربط المعيار الرئيسي
        'title',       // عنوان البند الفرعي (ممتاز، جيد، إلخ)
        'description', // وصف شروط البند
        'max_score',   // الدرجة المستحقة للبند
    ];

    /**
     * علاقة بند التقييم الفرعي مع المعيار الرئيسي التابع له.
     * علاقة متعدد إلى واحد (Many-To-One).
     */
    public function criterion()
    {
        return $this->belongsTo(EvaluationCriteria::class, 'criteria_id');
    }
}
