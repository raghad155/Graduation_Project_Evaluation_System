<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. تشغيل التغذية للأدوار والمدخلات الأساسية
        $this->call([
            RoleSeeder::class,
        ]);

        // السوبر أدمن الافتراضي
        $admin = User::firstOrCreate(
            ['phone_number' => '777777777'],
            [
                'full_name' => 'Ahmed',
                'email' => 'admin@system.local',
                'password' => Hash::make('123456')
            ]
        );

        $adminRole = \App\Models\Role::where('name', 'admin')->first();
        if ($adminRole && !$admin->roles()->where('role_id', $adminRole->id)->exists()) {
            $admin->roles()->attach($adminRole->id);
        }

        // إسناد دور المشرف لجميع المستخدمين الذين تمت إضافتهم مسبقاً ولديهم إيميل أو يعتبرون مشرفين
        $supervisorRole = \App\Models\Role::where('name', 'supervisor')->first();
        if ($supervisorRole) {
            $users = User::where('id', '!=', $admin->id)->get();
            foreach ($users as $user) {
                if (!$user->roles()->where('role_id', $supervisorRole->id)->exists()) {
                    $user->roles()->attach($supervisorRole->id);
                }
            }
        }
    }
}
