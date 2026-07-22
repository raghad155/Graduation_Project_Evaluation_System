<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\EvaluationGroup;
use App\Models\EvaluationCriteria;
use App\Models\EvaluationItem;

echo "--- Evaluation Groups ---\n";
print_r(EvaluationGroup::all()->toArray());

echo "\n--- Evaluation Criteria ---\n";
print_r(EvaluationCriteria::all()->toArray());

echo "\n--- Evaluation Items ---\n";
print_r(EvaluationItem::all()->toArray());
