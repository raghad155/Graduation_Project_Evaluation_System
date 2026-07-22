<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialization extends Model
{
    // نموذج التخصصات المرتبطة بالطلاب والمشاريع

    protected $fillable = [
        'name_en',
        'name_ar'
    ];

    public function students()
    {
        return $this->hasMany(Student::class);
    }
    
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
