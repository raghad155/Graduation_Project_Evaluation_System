<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
protected $fillable = [
        'title',
        'description',
        'supervisor_id',
    ];

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }
    }
