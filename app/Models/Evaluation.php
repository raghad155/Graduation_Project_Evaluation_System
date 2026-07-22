<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    // نموذج التقييم الخاص بالمشاريع من قبل المستخدمين
    protected $fillable = [
        'project_id',
        'user_id',
        'score',
        'notes'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'evaluation_id');
    }

    public function scores()
    {
        return $this->hasMany(EvaluationScore::class);
    }
}