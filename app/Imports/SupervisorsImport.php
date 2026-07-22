<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithLimit;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Validator;
use App\Models\Specialization;

class SupervisorsImport implements ToCollection, WithHeadingRow, WithLimit, WithChunkReading
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
            if (empty($row['full_name']) && empty($row['email'])) {
                break;
            }

            // محاولة إيجاد التخصص بناءً على النص (يشار له بـ department في الإكسل)
            $specId = $row['specialization_id'] ?? null;
            if (!$specId && !empty($row['department'])) {
                $deptName = $this->cleanArabic($row['department']);
                $specialization = Specialization::where('name_ar', 'like', "%{$deptName}%")
                                              ->orWhere('name_en', 'like', "%{$deptName}%")
                                              ->first();
                if (!$specialization) {
                    $specialization = Specialization::create([
                        'name_ar' => $deptName,
                        'name_en' => $deptName
                    ]);
                }
                $specId = $specialization->id;
            }

            $validator = Validator::make([
                'full_name'    => $row['full_name'] ?? null,
                'email'        => $row['email'] ?? null,
                'phone_number' => isset($row['phone_number']) ? (string) $row['phone_number'] : null,
                'specialization_id' => $specId,
            ], [
                'full_name'    => 'required|string|max:255',
                'email'        => 'nullable|email',
                'phone_number' => 'nullable|string|max:20',
                'specialization_id' => 'nullable|exists:specializations,id',
            ]);

            if ($validator->fails()) {
                throw new \Exception("خطأ في المشرف: " . ($row['full_name'] ?? 'مجهول') . " -> " . implode(", ", $validator->errors()->all()));
            }

            // البحث عن المشرف بالإيميل أو الاسم
            $supName = $this->cleanArabic($row['full_name'] ?? '');
            
            $user = null;
            if (!empty($row['email'])) {
                $user = User::where('email', $row['email'])->first();
            }
            if (!$user) {
                $user = User::where('full_name', $supName)->first();
            }

            if (!$user) {
                $user = User::create([
                    'full_name' => $supName,
                    'email'     => $row['email'] ?? null,
                    'phone_number' => isset($row['phone_number']) ? (string) $row['phone_number'] : null,
                    'specialization_id' => $specId,
                    'password'  => \Illuminate\Support\Facades\Hash::make($row['password'] ?? '123456'),
                ]);
            }

            // إعطاء صلاحية المشرف بشكل افتراضي وتأكيدها ولو كان موجوداً سابقاً
            $role = \App\Models\Role::where('name', 'supervisor')->first();
            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
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