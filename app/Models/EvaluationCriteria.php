<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationCriteria extends Model
{
    // نموذج معايير التقييم المستخدمة في النظام
    protected $table = 'evaluation_criteria';

    protected $fillable = [
        'name',         // اسم المعيار الرئيسي
        'description',  // وصف المعيار
        'weight',       // وزن المعيار
        'group_id',     // ربط بمجموعة التقييم
    ];

    /**
     * علاقة المعيار مع المجموعة التابع لها.
     */
    public function group()
    {
        return $this->belongsTo(EvaluationGroup::class, 'group_id');
    }

    /**
     * علاقة المعيار مع بنوده/مقاييسه الأربعة الفرعية.
     */
    public function items()
    {
        return $this->hasMany(EvaluationItem::class, 'criteria_id');
    }
}