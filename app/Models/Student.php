<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{

    protected $fillable = [
        'full_name',
        'academic_number',
        'project_id',
        'specialization_id',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }
}
