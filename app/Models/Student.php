<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    // نموذج الطالب ويحتوي على معلوماته وربطه بالمشروع والتخصص

    protected $fillable = [
        'full_name',
        'academic_number',
        'project_id',
        'specialization_id',
        'user_id',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
        return $this->belongsToMany(Project::class, 'project_students');

    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }
}
