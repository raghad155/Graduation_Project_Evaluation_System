<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationScore extends Model
{
    // نموذج درجات كل طالب وفق كل معيار تقييم وبند فرعي
    protected $fillable = [
        'evaluation_id', // ربط سجل التقييم الرئيسي
        'student_id',    // ربط الطالب المستهدف بالدرجة
        'criteria_id',   // ربط معيار التقييم
        'item_id',       // ربط بند التقييم الفرعي (المقياس)
        'score',         // الدرجة المرصودة
        'notes',         // ملاحظات البند الفرعي
    ];

    protected $table = 'evaluation_scores';

    /**
     * علاقة الدرجة بالتقييم العام المرفق.
     */
    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    /**
     * علاقة الدرجة بمعيار التقييم المباشر.
     */
    public function criteria()
    {
        return $this->belongsTo(
            EvaluationCriteria::class,
            'criteria_id'
        );
    }

    /**
     * علاقة الدرجة بالبند الفرعي أو المقاييس الأربعة.
     */
    public function item()
    {
        return $this->belongsTo(
            EvaluationItem::class,
            'item_id'
        );
    }
}