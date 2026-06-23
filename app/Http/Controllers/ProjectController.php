<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Specialization;
use App\Models\User;
use App\Models\Student;


class ProjectController extends Controller
{
    public function index()
{
    return Project::with([
        'supervisor',
        'specialization'
    ])->get();
}
public function store(Request $request)
{
    $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'academic_year' => 'nullable|string',
        'specialization_id' => 'required|exists:specializations,id',
        'supervisor_id' => 'nullable|exists:users,id',
    ]);

    $project = Project::create([
        'title' => $request->title,
        'description' => $request->description,
        'specialization_id' => $request->specialization_id,
        'supervisor_id' => $request->supervisor_id,
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
        'specialization'
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
    ]);

    $project->update([
        'title' => $request->title,
        'description' => $request->description,
        'academic_year' => $request->academic_year,
        'specialization_id' => $request->specialization_id,
        'supervisor_id' => $request->supervisor_id,
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
    return response()->json(
        $project->students
    );
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
