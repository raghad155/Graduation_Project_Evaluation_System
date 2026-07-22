<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Specialization;
use App\Models\User;
use App\Models\Student;
use App\Models\AuditLog;
use App\Imports\ProjectsImport;
use Maatwebsite\Excel\Facades\Excel;

class ProjectController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([], 401);
        }

        $query = Project::with([
            'supervisor',
            'specialization',
            'committee'
        ]);

        // Admins can see everything. Non-admins only see their relevant projects.
        if (!$user->roles()->where('name', 'admin')->exists()) {
            $committeeIds = \DB::table('committee_user')->where('user_id', $user->id)->pluck('committee_id');
            
            $query->where(function ($q) use ($user, $committeeIds) {
                $q->where('supervisor_id', $user->id)
                  ->orWhereIn('committee_id', $committeeIds);
            });
        }

        return $query->get();
    }
public function store(Request $request)
{
    $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'academic_year' => 'nullable|string',
        'specialization_id' => 'required|exists:specializations,id',
        'supervisor_id' => 'nullable|exists:users,id',
        'committee_id' => 'nullable|exists:committees,id',
    ]);

    $project = Project::create([
        'title' => $request->title,
        'description' => $request->description,
        'specialization_id' => $request->specialization_id,
        'supervisor_id' => $request->supervisor_id,
        'committee_id' => $request->committee_id,
    ]);

    return response()->json([
        'message' => 'Project created successfully',
        'project' => $project
    ], 201);
}
public function show($id)
{
    return Project::with([
        'supervisor',
        'specialization',
        'committee'
    ])->findOrFail($id);
}
public function update(Request $request, $id)
{
    $project = Project::findOrFail($id);

    $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'academic_year' => 'nullable|string',
        'specialization_id' => 'required|exists:specializations,id',
        'supervisor_id' => 'nullable|exists:users,id',
        'committee_id' => 'nullable|exists:committees,id',
    ]);

    $project->update([
        'title' => $request->title,
        'description' => $request->description,
        'academic_year' => $request->academic_year,
        'specialization_id' => $request->specialization_id,
        'supervisor_id' => $request->supervisor_id,
        'committee_id' => $request->committee_id,
    ]);

    return response()->json([
        'message' => 'Project updated successfully',
        'project' => $project
    ]);
}
public function destroy($id)
{
    $project = Project::findOrFail($id);

    $project->delete();

    return response()->json([
        'message' => 'Project deleted successfully'
    ]);
}


public function assignStudent(Request $request, Project $project)
{
    $request->validate([
        'student_id' => 'required|exists:students,id',
    ]);

    $student = Student::findOrFail($request->student_id);

    //  منع الطالب من مشروع آخر
    if ($student->project_id) {
        return response()->json([
            'message' => 'Student already assigned to a project'
        ], 422);
    }

    // الحد الأقصى لعدد الطلاب
if ($project->students()->count() >= $project->max_students) {
    return response()->json([
        'message' => 'Project reached maximum number of students'
    ], 422);
}

    if ($project->students()->count() >= $maxStudents) {
        return response()->json([
            'message' => 'Project reached maximum number of students'
        ], 422);
    }

    // الإسناد
    $student->project_id = $project->id;
    $student->save();

    return response()->json([
        'message' => 'Student assigned successfully',
        'student_id' => $student->id,
        'project_id' => $project->id
    ]);
}
    public function getStudents(Project $project)
    {
        return response()->json($project->students);
    }

    public function toggleLock(Request $request, Project $project)
    {
        // إذا كان مقفلاً، فقط رئيس اللجنة يمكنه فك הקفل (Unlock).
        // إذا كان غير مقفل، يمكن لأي شخص مصرح دخوله أن يقفله (Lock).
        if ($project->is_locked && !auth()->user()->hasRole('committee_head')) {
            return response()->json([
                'message' => 'فك اعتماد التقييم متاح لرئيس اللجنة فقط.'
            ], 403);
        }

        $project->is_locked = !$project->is_locked;
        $project->save();

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $project->is_locked ? 'PROJECT_LOCKED' : 'PROJECT_UNLOCKED',
            'details' => "Project ID {$project->id} status changed to " . ($project->is_locked ? "Locked" : "Unlocked"),
            'ip_address' => request()->ip()
        ]);

        return response()->json([
            'message' => 'تم تغيير حالة الاعتماد بنجاح.',
            'is_locked' => $project->is_locked
        ]);
    }

    public function importExcel(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv',
        ]);

        try {
            $beforeCount = Project::count();
            Excel::import(new ProjectsImport, $request->file('file'));
            $afterCount = Project::count();

            return response()->json([
                'message' => 'Projects imported successfully.',
                'imported' => $afterCount - $beforeCount,
            ], 200);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Projects Import Exception: " . $e->getMessage());
            return response()->json([
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }
 
public function changeStudent(Request $request, Project $project)
{
    $request->validate([
        'student_id' => 'required|exists:students,id'
    ]);

    $student = Student::findOrFail($request->student_id);

    // منع الطالب إذا كان في مشروع آخر
    if ($student->project_id && $student->project_id != $project->id) {
        return response()->json([
            'message' => 'Student is already assigned to another project'
        ], 422);
    }

    // التحقق من سعة المشروع
    if ($project->students()->count() >= $project->max_students) {
        return response()->json([
            'message' => 'Project reached maximum capacity'
        ], 422);
    }

    // تنفيذ التعديل
    $student->project_id = $project->id;
    $student->save();

    return response()->json([
        'message' => 'Student moved successfully'
    ]);
}

public function removeStudent(
    Project $project,
    Student $student
)
{
    if($student->project_id != $project->id){

        return response()->json([
            'message'=>'Student not found in this project'
        ],404);
    }

    $student->project_id=null;

    $student->save();

    return response()->json([
        'message'=>'Student removed successfully'
    ]);
}
}
