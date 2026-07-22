<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    // نموذج المستخدم ويحتوي على بيانات الدخول والأدوار والمشاريع المشرف عليها
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'full_name',
        'email',
        'password',
        'specialization_id',
        'phone_number',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasRole(string $roleName)
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    public function supervisedProjects()
    {
        return $this->hasMany(Project::class, 'supervisor_id');
    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }

    /**
     * اللجان التي يشترك فيها المستخدم
     */
    public function committees()
    {
        return $this->belongsToMany(Committee::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }
}
