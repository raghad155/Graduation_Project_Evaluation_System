<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'specialization_id',
        'supervisor_id',
        'committee_id',
        'max_students',
        'is_locked',
    ];

    public function index()
    {
        $projects = Project::query()->get();

        return response()->json($projects);
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function committee()
    {
        return $this->belongsTo(Committee::class);
    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }
}
