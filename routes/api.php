<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentController;


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