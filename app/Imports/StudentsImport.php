<?php

namespace App\Imports;

use App\Models\Student;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithLimit;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Validator;
use App\Models\Specialization;
use App\Models\Project;

class StudentsImport implements ToCollection, WithHeadingRow, WithLimit, WithChunkReading
{

    public function chunkSize(): int
    {
        return 200; // قراءة 200 صف في المرة الواحدة لحماية الذاكرة (RAM)
    }


    public function limit(): int
    {
        return 1000; // الحد الأقصى المطلق لحماية النظام من الانهيار (Crash)
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            if (empty($row['full_name']) && empty($row['academic_number'])) {
                break;
            }

            // محاولة إيجاد التخصص بناءً على النص أو المعرف وإنشاؤه إن لم يكن موجوداً
            $specId = $row['specialization_id'] ?? null;
            if (!$specId && !empty($row['specialization'])) {
                $specName = $this->cleanArabic($row['specialization']);
                $specialization = Specialization::where('name_ar', 'like', "%{$specName}%")
                                              ->orWhere('name_en', 'like', "%{$specName}%")
                                              ->first();
                if (!$specialization) {
                    $specialization = Specialization::create([
                        'name_ar' => $specName,
                        'name_en' => $specName
                    ]);
                }
                $specId = $specialization->id;
            }

            // محاولة إيجاد المشروع بناءً على العنوان أو إنشاؤه
            $projectId = $row['project_id'] ?? null;
            if (!$projectId && !empty($row['project_title'])) {
                $projTitle = $this->cleanArabic($row['project_title']);
                $project = Project::where('title', 'like', "%{$projTitle}%")->first();
                if (!$project && $specId) {
                    $project = Project::create([
                        'title' => $projTitle,
                        'description' => '',
                        'specialization_id' => $specId,
                        'supervisor_id' => null,
                        'max_students' => 1
                    ]);
                }
                if ($project) {
                    $projectId = $project->id;
                }
            }

            // التحقق من صحة البيانات
            $validator = Validator::make([
                'full_name'         => $row['full_name'] ?? null,
                'academic_number'   => $row['academic_number'] ?? null,
                'specialization_id' => $specId,
                'project_id'        => $projectId,
            ], [
                'full_name'         => 'required|string|max:255',
                'academic_number'   => 'required|unique:students,academic_number',
                'specialization_id' => 'required|exists:specializations,id',
                'project_id'        => 'nullable|exists:projects,id',
            ], [
                'academic_number.unique'   => 'الرقم الأكاديمي مكرر',
                'specialization_id.exists' => 'التخصص ('.$row['specialization'].') غير موجود في النظام',
                'project_id.exists'        => 'المشروع ('.$row['project_title'].') غير موجود',
                'specialization_id.required'=> 'حقل التخصص مطلوب. تأكد من تطابق الاسم المكتوب في الإكسل.',
            ]);

            if ($validator->fails()) {
                throw new \Exception("خطأ في بيانات الطالب: " . ($row['full_name'] ?? 'مجهول') . " -> " . implode(", ", $validator->errors()->all()));
            }

            Student::create([
                'full_name'         => $this->cleanArabic($row['full_name'] ?? ''),
                'academic_number'   => $row['academic_number'] ?? null,
                'specialization_id' => $specId,
                'project_id'        => $projectId,
            ]);
        }
    }

    /**
     * تنظيف الأسطر والمسافات
     */
    private function cleanArabic(string $text): string
    {
        return trim($text);
    }
}