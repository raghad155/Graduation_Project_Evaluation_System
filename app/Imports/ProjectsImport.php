<?php

namespace App\Imports;

use App\Models\Project;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithLimit;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Validator;
use App\Models\Specialization;
use App\Models\User;

class ProjectsImport implements ToCollection, WithHeadingRow, WithLimit, WithChunkReading
{


    public function chunkSize(): int
    {
        return 200;
    }

    public function limit(): int
    {
        return 1000;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            if (empty($row['title'])) {
                break;
            }

            // محاولة إيجاد التخصص بناءً على النص أو المعرف
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

            // محاولة إيجاد المشرف بناءً على النص أو المعرف
            $supervisorId = $row['supervisor_id'] ?? null;
            if (!$supervisorId && !empty($row['supervisor'])) {
                $supName = $this->cleanArabic($row['supervisor']);
                $supervisor = User::whereHas('roles', function($q) {
                                      $q->where('name', 'supervisor');
                                  })
                                  ->where('full_name', 'like', "%{$supName}%")
                                  ->first();
                if ($supervisor) {
                    $supervisorId = $supervisor->id;
                }
            }

            $validator = Validator::make([
                'title'             => $row['title'] ?? null,
                'description'       => $row['description'] ?? null,
                'max_students'      => $row['max_students'] ?? 1,
                'supervisor_id'     => $supervisorId,
                'specialization_id' => $specId,
                'committee_id'      => $row['committee_id'] ?? null,
            ], [
                'title'             => 'required|string|max:255',
                'description'       => 'nullable|string',
                'max_students'      => 'required|integer|min:1',
                'supervisor_id'     => 'nullable|exists:users,id',
                'specialization_id' => 'required|exists:specializations,id',
                'committee_id'      => 'nullable|exists:committees,id',
            ]);

            if ($validator->fails()) {
                throw new \Exception("خطأ في المشروع: " . ($row['title'] ?? 'مجهول') . " -> " . implode(", ", $validator->errors()->all()));
            }

            Project::create([
                'title'             => $this->cleanArabic($row['title'] ?? ''),
                'description'       => $this->cleanArabic($row['description'] ?? ''),
                'max_students'      => $row['max_students'] ?? 1,
                'supervisor_id'     => $supervisorId,
                'specialization_id' => $specId,
                'committee_id'      => $row['committee_id'] ?? null,
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
