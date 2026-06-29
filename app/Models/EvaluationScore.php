<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationScore extends Model
{
 protected $fillable = [

    'evaluation_id',
    'student_id',
    'criteria_id',
    'score'

 ];

    protected $table='evaluation_scores';

    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function criteria()
    {
        return $this->belongsTo(
            EvaluationCriteria::class,
            'criteria_id'
        );
    }
}