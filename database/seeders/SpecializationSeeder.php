<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpecializationSeeder extends Seeder
{
    public function run(): void
    {
        $specializations = [
            ['name' => 'Computer Science',          'description' => 'علوم الحاسوب'],
            ['name' => 'Information Technology',    'description' => 'تقنية المعلومات'],
            ['name' => 'Software Engineering',      'description' => 'هندسة البرمجيات'],
            ['name' => 'Cybersecurity',             'description' => 'الأمن السيبراني'],
            ['name' => 'Artificial Intelligence',   'description' => 'الذكاء الاصطناعي'],
            ['name' => 'Data Science',              'description' => 'علم البيانات'],
            ['name' => 'Network Engineering',       'description' => 'هندسة الشبكات'],
        ];

        foreach ($specializations as $spec) {
            DB::table('specializations')->insertOrIgnore([
                'name'        => $spec['name'],
                'description' => $spec['description'],
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }
}
