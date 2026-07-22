<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\EvaluationGroup;
use App\Models\EvaluationCriteria;
use Illuminate\Http\Request;
use App\Http\Controllers\EvaluationGroupController;

// Find Ahmed
$user = User::where('full_name', 'Ahmed')->first();
if (!$user) {
    echo "Ahmed not found!\n";
    exit(1);
}

// Authenticate Ahmed
auth()->login($user);

// Find first evaluation group
$group = EvaluationGroup::first();
if (!$group) {
    echo "No evaluation groups found in the database. Please create a group first.\n";
    exit(1);
}

$controller = new EvaluationGroupController();
$request = Request::create("/api/evaluation-groups/{$group->id}/criteria", 'POST', [
    'title' => 'Criterion Test',
    'weight' => 50
]);

echo "Sending request to store criterion for Group ID {$group->id}...\n";
try {
    $response = $controller->storeCriterion($request, $group->id);
    echo "Response Code: " . $response->getStatusCode() . "\n";
    echo "Response Content: " . $response->getContent() . "\n\n";
} catch (\Exception $e) {
    echo "Error caught: " . $e->getMessage() . "\n";
}

$criteriaCount = EvaluationCriteria::count();
echo "Total Evaluation Criteria in Database: " . $criteriaCount . "\n";
