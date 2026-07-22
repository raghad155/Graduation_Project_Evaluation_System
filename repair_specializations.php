<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Specialization;

$mapping = [
    1 => ['ar' => 'علوم الحاسوب', 'en' => 'Computer Science'],
    2 => ['ar' => 'تقنية المعلومات', 'en' => 'Information Technology'],
    3 => ['ar' => 'هندسة البرمجيات', 'en' => 'Software Engineering'],
    4 => ['ar' => 'الأمن السيبراني', 'en' => 'Cybersecurity'],
    5 => ['ar' => 'الذكاء الاصطناعي', 'en' => 'Artificial Intelligence'],
    6 => ['ar' => 'علم البيانات', 'en' => 'Data Science'],
    7 => ['ar' => 'هندسة الشبكات', 'en' => 'Network Engineering'],
];

foreach ($mapping as $id => $names) {
    $spec = Specialization::find($id);
    if ($spec) {
        $spec->name_ar = $names['ar'];
        $spec->name_en = $names['en'];
        $spec->save();
        echo "Updated Specalization ID $id successfully!\n";
    }
}
echo "Done!\n";
