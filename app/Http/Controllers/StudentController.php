<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\StudentsImport;
use Exception;

class StudentController extends Controller
{
    // جلب كل الطلاب
    public function index()
    {
        return response()->json(Student::all());
    }

    // استيراد ملف إكسل للطلاب
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,xls',
        ]);

        try {
            $beforeCount = Student::count();
            Excel::import(new StudentsImport, $request->file('file'));
            $afterCount = Student::count();

            return response()->json([
                'message' => 'تم استيراد بيانات الطلاب بنجاح.',
                'imported' => $afterCount - $beforeCount,
            ]);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error("Excel Import Exception: " . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'حدث خطأ أثناء الاستيراد.',
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    // إضافة طالب
    public function store(Request $request)
    {
        $request->validate([
            'fullName' => 'required|string|max:255',
            'academicNumber' => 'required|string|max:255',
            'specialization' => 'required',
            'projectId' => 'nullable'
        ]);

        $student = Student::create([
            'full_name' => $request->fullName,
            'academic_number' => $request->academicNumber,
            'specialization_id' => $request->specialization,
            'project_id' => $request->projectId ?: null
        ]);

        return response()->json([
            'message' => 'Student created successfully',
            'data' => $student
        ]);
    }

    // عرض طالب واحد
    public function show($id)
    {
        $student = Student::findOrFail($id);

        return response()->json($student);
    }

    // تعديل طالب
    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $request->validate([
            'fullName' => 'required|string|max:255',
            'academicNumber' => 'required|string|max:255',
            'specialization' => 'required',
            'projectId' => 'nullable'
        ]);

        $student->update([
            'full_name' => $request->fullName,
            'academic_number' => $request->academicNumber,
            'specialization_id' => $request->specialization,
            'project_id' => $request->projectId ?: null
        ]);

        return response()->json([
            'message' => 'Student updated successfully',
            'data' => $student
        ]);
    }

    // حذف طالب
    public function destroy($id)
    {
        $student = Student::findOrFail($id);

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully'
        ]);
    }
}
