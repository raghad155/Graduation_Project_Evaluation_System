<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Specialization;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Let's find unique specializations by name
$specializations = Specialization::all();
$seen = [];
$duplicates = [];

foreach ($specializations as $spec) {
    $normalizedName = trim(strtolower($spec->name_en ?: $spec->description));
    if (!$normalizedName && $spec->name_ar) {
        $normalizedName = trim(strtolower($spec->name_ar));
    }
    
    if (isset($seen[$normalizedName])) {
        // This is a duplicate!
        $duplicates[$spec->id] = $seen[$normalizedName];
    } else {
        $seen[$normalizedName] = $spec->id;
    }
}

echo "Duplicate mappings found (ID to keep -> ID to delete):\n";
foreach ($duplicates as $duplicateId => $keepId) {
    echo "Duplicate ID: $duplicateId will be merged into ID: $keepId\n";
    
    // Update students
    Student::where('specialization_id', $duplicateId)->update(['specialization_id' => $keepId]);
    
    // Update users
    User::where('specialization_id', $duplicateId)->update(['specialization_id' => $keepId]);
    
    // Delete duplicate
    Specialization::where('id', $duplicateId)->delete();
}

echo "Cleanup complete!\n";
