<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
  
public function rules(): array
{
    return [
        'full_name' => 'required|string|max:255',
        'academic_number' => 'required|unique:students,academic_number,' . $this->route('id'),
        'specialization_id' => 'required|exists:specializations,id',
        'project_id' => 'nullable|exists:projects,id',
    ];
}
}
