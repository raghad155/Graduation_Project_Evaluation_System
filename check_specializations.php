<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::getSchemaBuilder()->getColumnListing('specializations');
echo "Columns: " . implode(', ', $columns) . "\n";

$records = DB::table('specializations')->get();
foreach ($records as $r) {
    echo json_encode($r) . "\n";
}
