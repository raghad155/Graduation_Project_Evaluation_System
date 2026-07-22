<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
//use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\StudentController;

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SupervisorController;
//use App\Models\EvaluationCriteria;
use App\Http\Controllers\EvaluationCriteriaController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\AdminDataController;
use App\Http\Controllers\EvaluationGroupController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CommitteeController;
use App\Http\Controllers\FeedbackController;



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

// TODO: تأكد من صحة اسم الـ Controller والـ namespace قبل الربط بالـ route
// TODO: لا تضف نفس الـ route مرتين بدون داع
// TODO: استخدم middleware للأدوار عند الحاجة مثل admin أو supervisor
// TODO: راجع اسم الدالة في الـ Controller قبل كتابة [Controller::class, 'method']

// تسجيل الدخول
Route::post('/login', [AuthController::class, 'login']);

// إدارة المستخدمين والأدوار (للمدير فقط)
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::get('/roles', function () {
        return response()->json(\App\Models\Role::all(['id', 'name']));
    });
});

// اختبار المصادقة
Route::middleware('auth:sanctum')->get('/test', function () {
    return response()->json(['message' => 'OK']);
});

// مسارات خاصة بالمشرف
Route::middleware(['auth:sanctum', 'role:supervisor'])
    ->get('/supervisor/projects', function () {
        return "Supervisor area";
    });

// مسارات خاصة بأعضاء اللجنة
Route::middleware(['auth:sanctum', 'role:committee_member'])
    ->get('/committee/discussions', function () {
        return "Committee area";
    });

// مسارات خاصة بالمدير
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/users', function () {
        return "Admin panel";
    });
    Route::get('/backup/download', [AdminDataController::class, 'downloadBackup']);
    Route::get('/audit-logs', [AdminDataController::class, 'getAuditLogs']);
});

// مسارات خاصة برئيس اللجنة
Route::middleware(['auth:sanctum', 'role:committee_head'])
    ->get('/committee/head/dashboard', function () {
        return "Committee Head Area";
    });

// مسار اختبار إضافي
Route::middleware(['auth:sanctum', 'role:committee_head'])
    ->get('/test', function () {
        return response()->json([
            'message' => 'Access Granted 🎉'
        ]);
    });

// إدارة الطلاب
Route::apiResource('students', StudentController::class);
Route::post('students/import', [StudentController::class, 'import']);

// إدارة المشرفين
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/supervisors', [SupervisorController::class, 'index']);
    Route::post('/supervisors', [SupervisorController::class, 'store']);
    Route::get('/supervisors/{id}', [SupervisorController::class, 'show']);
    Route::put('/supervisors/{id}', [SupervisorController::class, 'update']);
    Route::delete('/supervisors/{id}', [SupervisorController::class, 'destroy']);
});

// إدارة المشاريع
Route::post('/projects/import', [ProjectController::class, 'importExcel']);
Route::apiResource('projects', ProjectController::class);
Route::post('/projects/{project}/assign-student', [ProjectController::class, 'assignStudent']);
// حذف apiResource لـ supervisors لوجودها أعلاه
// Route::apiResource('supervisors', SupervisorController::class);

// إدارة اللجان
Route::middleware(['auth:sanctum', 'role:admin|committee_head'])->group(function () {
    Route::apiResource('committees', CommitteeController::class);
});

// ربط الطالب بالمشروع
Route::post('/projects/{project}/assign-student', [ProjectController::class, 'assignStudent']);
Route::get('/projects/{project}/students', [ProjectController::class, 'getStudents']);
Route::put('/projects/{project}/change-student', [ProjectController::class, 'changeStudent']);
Route::delete('/projects/{project}/remove-student/{student}', [ProjectController::class, 'removeStudent']);

// قفل / فك قفل التقييم
Route::middleware('auth:sanctum')->post('/projects/{project}/toggle-lock', [ProjectController::class, 'toggleLock']);

// مسار جلب بيانات النظام الإداري المجمعة للواجهات
Route::middleware('auth:sanctum')->get('/admin-data', [AdminDataController::class, 'index']);

// مسار رصد درجات التقييم (مشترك للجميع الأعضاء المصرح لهم واللجنة)
Route::middleware('auth:sanctum')->post('/project-scores', [EvaluationController::class, 'storeProjectScore']);

// مسارات رسائل وملاحظات التقييم
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/projects/{project}/feedbacks', [FeedbackController::class, 'index']);
    Route::post('/projects/{project}/feedbacks', [FeedbackController::class, 'store']);
    Route::delete('/feedbacks/{feedback}', [FeedbackController::class, 'destroy']);
});

// مسارات إدارة أعضاء المشاريع
Route::middleware(['auth:sanctum', 'role:committee_head'])->group(function () {
    Route::post('/project-members', [ProjectController::class, 'assignStudentMember']);
    Route::delete('/project-members/{studentId}', [ProjectController::class, 'removeStudentMember']);
});

// مسارات مجموعات معايير التقييم والبنود الفرعية
// الجلب متاح لجميع الأعضاء المصرح لهم بالدخول + المشرف
Route::middleware('auth:sanctum')->get('/evaluation-groups', [EvaluationGroupController::class, 'index']);

// التعديل والإضافة والحذف محصور لرئيس اللجنة أو المشرف (لمجموعاته الخاصة)
Route::middleware(['auth:sanctum', 'role:committee_head|supervisor'])->group(function () {
    Route::post('/evaluation-groups', [EvaluationGroupController::class, 'store']);
    Route::put('/evaluation-groups/{id}', [EvaluationGroupController::class, 'update']);
    Route::delete('/evaluation-groups/{id}', [EvaluationGroupController::class, 'destroy']);
    
    // إضافة وتحديث وحذف معيار تابع لمجموعة
    Route::post('/evaluation-groups/{evaluation_group}/duplicate', [EvaluationGroupController::class, 'duplicate']);
    Route::post('/evaluation-groups/{group}/criteria', [EvaluationGroupController::class, 'storeCriterion']);
    Route::put('/evaluation-groups/{group}/criteria/{criterion}', [EvaluationGroupController::class, 'updateCriterion']);
    Route::delete('/evaluation-groups/{group}/criteria/{criterion}', [EvaluationGroupController::class, 'destroyCriterion']);
    
    // استبدال مقاييس معيار (items)
    Route::put('/evaluation-groups/{group}/criteria/{criterion}/items', [EvaluationGroupController::class, 'replaceItems']);
});

// إدارة معايير التقييم
Route::get('/evaluation-criteria', [EvaluationCriteriaController::class, 'index']);
Route::post('/evaluation-criteria', [EvaluationCriteriaController::class, 'store']);
Route::put('/evaluation-criteria/{id}', [EvaluationCriteriaController::class, 'update']);
Route::delete('/evaluation-criteria/{id}', [EvaluationCriteriaController::class, 'destroy']);

// إدارة التقييمات
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/evaluations', [EvaluationController::class, 'index']);
    Route::post('/evaluations', [EvaluationController::class, 'store']);
    Route::put('/evaluations/{id}', [EvaluationController::class, 'update']);
    Route::delete('/evaluations/{id}', [EvaluationController::class, 'destroy']);
});
Route::post('/evaluation-scores', [EvaluationController::class, 'storeScores']);
Route::get('/evaluations/{id}/final-score', [EvaluationController::class, 'calculateFinalScore']);
Route::get('/evaluations/{evaluation}/students/{student}/final-score', [EvaluationController::class, 'finalScore']);

// تقارير المشاريع
Route::get('/projects/reports', function () {
    return response()->json([
        'status' => 'ROUTE WORKS'
    ]);
});
Route::get('/projects/{id}/report', [EvaluationController::class, 'projectReport']);
Route::get('/projects/with-evaluations', [EvaluationController::class, 'projectsWithEvaluations']);
Route::get('/projects/{id}/final-scores', [EvaluationController::class, 'calculateFinalScores']);

// تصدير البيانات
Route::get('/projects/export/excel', [EvaluationController::class, 'exportAllExcel']);
Route::get('/projects/{id}/export/excel', [EvaluationController::class, 'exportProjectExcel']);
Route::get('/projects/{id}/export/pdf', [EvaluationController::class, 'exportProjectPdf']);
Route::get('/projects/export/pdf', [EvaluationController::class, 'exportAllPdf']);

// لوحة التحكم والإحصائيات
Route::get('/dashboard/stats', [EvaluationController::class, 'dashboardStats']);
Route::get('/dashboard/top-low-projects', [EvaluationController::class, 'topLowProjects']);
Route::get('/dashboard/charts', [EvaluationController::class, 'chartsData']);

// مسارات عامة أخرى
// Route::get('/users', [UserController::class, 'index']);
Route::get('/criteria', [EvaluationCriteriaController::class, 'index']);
Route::get('/students', [StudentController::class, 'index']);
Route::get('/supervisors', [SupervisorController::class, 'index']);
Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/specializations', [App\Http\Controllers\SpecializationController::class, 'index']);
Route::post('/students', [StudentController::class, 'store']);
Route::get('/students/{id}', [StudentController::class, 'show']);
Route::put('/students/{id}', [StudentController::class, 'update']);
Route::delete('/students/{id}', [StudentController::class, 'destroy']);
Route::post(
'/supervisors/import',
[SupervisorController::class,'importExcel']
);
Route::post(
'/supervisors/import',
[AuthController::class,'importSupervisors']
);Route::get('/role-permissions', function() { return response()->json([]); });
