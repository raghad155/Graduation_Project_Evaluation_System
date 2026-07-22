<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\EvaluationGroup;

$groups = EvaluationGroup::with('criteria.items')->get();
echo json_encode($groups, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
