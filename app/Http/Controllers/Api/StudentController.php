<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\StoreStudentRequest;
use App\Imports\StudentsImport;
use Maatwebsite\Excel\Facades\Excel;
class StudentController extends Controller
{
    public function index()
    {
        $students = Student::with([
            'specialization',
            'project'
        ])->get();

        return response()->json($students);
    }

    public function store(StoreStudentRequest $request)
    {
        $student = Student::create([
            'full_name' => $request->full_name,
            'academic_number' => $request->academic_number,
            'specialization_id' => $request->specialization_id,
            'project_id' => $request->project_id,
        ]);

        return response()->json([
            'message' => 'Student created successfully',
            'student' => $student
        ], 201);
    }

    public function show(string $id)
    {
        $student = Student::with([
            'specialization',
            'project'
        ])->findOrFail($id);

        return response()->json($student);
    }

    public function update(UpdateStudentRequest $request, string $id)
    {
        $student = Student::findOrFail($id);

        $student->update([
            'full_name' => $request->full_name,
            'academic_number' => $request->academic_number,
            'specialization_id' => $request->specialization_id,
            'project_id' => $request->project_id,
        ]);

        return response()->json([
            'message' => 'Student updated successfully',
            'student' => $student
        ]);
    }

    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully'
        ]);
    }

    public function import(Request $request)
{/*
    $request->validate([
    'file' => 'required'   ]);
*/
   // dd($request->file('file')); // 

    Excel::import(new StudentsImport, $request->file('file'));

    return response()->json([
        'message' => 'Students imported successfully'
    ]);
}
}