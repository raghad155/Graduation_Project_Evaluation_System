<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SupervisorController;



/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('/test', function () {
    return response()->json(['message' => 'OK']);
});
Route::middleware(['auth:sanctum', 'role:supervisor'])
    ->get('/supervisor/projects', function () {
        return "Supervisor area";
    });
Route::middleware(['auth:sanctum', 'role:committee_member'])
    ->get('/committee/discussions', function () {
        return "Committee area";
    });
Route::middleware(['auth:sanctum', 'role:admin'])
    ->get('/admin/users', function () {
        return "Admin panel";
    });
Route::middleware(['auth:sanctum', 'role:committee_head'])
    ->get('/committee/head/dashboard', function () {
        return "Committee Head Area";
    });
/*Route::get('/test', function () {
    return 'WORKING';
 });*/
 Route::middleware(['auth:sanctum', 'role:committee_head'])
    ->get('/test', function () {
        return response()->json([
            'message' => 'Access Granted 🎉'
        ]);
    });

Route::apiResource('students', StudentController::class);
Route::post('students/import', [StudentController::class, 'import']);
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/supervisors', [SupervisorController::class, 'index']);
    Route::post('/supervisors', [SupervisorController::class, 'store']);
    Route::get('/supervisors/{id}', [SupervisorController::class, 'show']);
    Route::put('/supervisors/{id}', [SupervisorController::class, 'update']);
    Route::delete('/supervisors/{id}', [SupervisorController::class, 'destroy']);
});
Route::apiResource('projects', ProjectController::class);
Route::post('/projects/{project}/assign-student', [ProjectController::class, 'assignStudent']);
Route::apiResource('supervisors', SupervisorController::class);



Route::post('/projects/{project}/assign-student',
    [ProjectController::class,'assignStudent']);

Route::get('/projects/{project}/students',
    [ProjectController::class,'getStudents']);

Route::put('/projects/{project}/change-student',
    [ProjectController::class,'changeStudent']);

Route::delete('/projects/{project}/remove-student/{student}',
    [ProjectController::class,'removeStudent']);