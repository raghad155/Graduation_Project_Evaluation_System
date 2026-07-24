<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Project;
use App\Models\EvaluationGroup;
use App\Models\EvaluationScore;
use App\Models\Committee;
use App\Models\Role;
use App\Models\Specialization;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AdminDataController extends Controller
{
    /**
     * جلب الحزمة الكاملة لبيانات الإدارة الموجهة للوحة التحكم للواجهات.
     * تجمع هذه الطريقة جميع الطلاب، المشرفين، المشاريع، أعضاء المشاريع، مجموعات التقييم والدرجات في استجابة واحدة.
     */
    public function index()
    {
        // 1. جلب الطلاب
        $students = Student::all();

        // 2. جلب المشرفين (المستخدمين الذين يحملون دور supervisor) مع احتساب عدد المشاريع النشطة
        $supervisors = User::whereHas('roles', function ($q) {
            $q->where('name', 'supervisor');
        })
        ->withCount('supervisedProjects as active_projects_count')
        ->get();

        // 3. جلب جميع المشاريع
        $projects = Project::all();

        // 4. استخلاص أعضاء المشاريع (يمثل الطلاب المسندين إلى مشاريع حالياً)
        $projectMembers = Student::whereNotNull('project_id')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id, // نستخدم معرف الطالب كمعرف فريد لعضوية المشروع
                    'project_id' => $student->project_id,
                    'student_id' => $student->id,
                    'notes' => '', // لا يوجد ملاحظات مخزنة بشكل عام، نرجع قيمة فارغة
                    'joined_at' => $student->created_at ? $student->created_at->toISOString() : now()->toISOString(),
                ];
            });

        // 5. جلب مجموعات التقييم مع المعايير والبنود الفرعية التابعة لها
        $evaluationGroups = EvaluationGroup::with(['criteria.items'])->get();

        // 6. جلب جميع درجات الطلاب المدخلة للمشاريع
        $projectScores = EvaluationScore::with(['evaluation'])
            ->get()
            ->map(function ($score) {
                return [
                    'project_id' => $score->evaluation ? $score->evaluation->project_id : 0,
                    'student_id' => $score->student_id,
                    'item_id' => $score->item_id ?? 0,
                    'score' => $score->score,
                    'notes' => $score->notes ?? '',
                ];
            });

        // إرجاع النتيجة الكاملة المتوافقة مع الكائن AdminDataPayload في Angular
        return response()->json([
            'students' => $students,
            'supervisors' => $supervisors,
            'projects' => $projects,
            'projectMembers' => $projectMembers,
            'evaluationGroups' => $evaluationGroups,
            'projectScores' => $projectScores,
        ]);
    }

    /**
     * تصدير جميع بيانات النظام كملف JSON لعمل نسخة احتياطية
     */
    public function downloadBackup()
    {
        $data = [
            'users' => User::with('roles')->get(),
            'students' => Student::all(),
            'committees' => Committee::all(),
            'specializations' => Specialization::all(),
            'projects' => Project::with(['students', 'evaluations.scores'])->get(),
            'evaluation_groups' => EvaluationGroup::with('criteria.items')->get()
        ];

        return response()->json($data, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                         ->header('Content-Disposition', 'attachment; filename="system_backup_' . date('Ymd_His') . '.json"');
    }

    /**
     * جلب سجلات التدقيق والحركات (للأدمن)
     */
    public function getAuditLogs()
    {
        $logs = AuditLog::with('user')->orderBy('created_at', 'desc')->take(200)->get();
        return response()->json($logs);
    }
}
