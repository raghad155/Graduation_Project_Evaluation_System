<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationGroup extends Model
{
    /**
     * جدول قواعد مجموعات التقييم.
     */
    protected $table = 'evaluation_groups';

    /**
     * الحقول القابلة للتعبئة الجماعية.
     */
    protected $fillable = [
        'title',
        'description',
        'specialization_id',
        'weight',
        'type',   // 'committee' | 'supervisor'
    ];

    /**
     * علاقة مجموعة التقييم مع المعايير التابعة لها.
     * علاقة واحد إلى متعدد (One-To-Many).
     */
    public function criteria()
    {
        return $this->hasMany(EvaluationCriteria::class, 'group_id');
    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }
}
