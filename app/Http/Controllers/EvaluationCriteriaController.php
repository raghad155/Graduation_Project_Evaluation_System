<?php

namespace App\Http\Controllers;

use App\Models\EvaluationCriteria;
use Illuminate\Http\Request;

class EvaluationCriteriaController extends Controller
{
    // 📌 جلب كل المعايير (API للـ dropdown)
    public function index()
    {
        return response()->json(EvaluationCriteria::all());
    }

    // 📌 إنشاء معيار جديد
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'weight' => 'required|integer|min:1|max:100'
        ]);

        $criteria = EvaluationCriteria::create($request->all());

        return response()->json([
            'message' => 'Criteria created successfully',
            'data' => $criteria
        ]);
    }

    // 📌 تحديث معيار
    public function update(Request $request, $id)
    {
        $criteria = EvaluationCriteria::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'weight' => 'required|integer|min:1|max:100'
        ]);

        $criteria->update($request->all());

        return response()->json([
            'message' => 'Criteria updated successfully',
            'data' => $criteria
        ]);
    }

    // 📌 حذف معيار
    public function destroy($id)
    {
        $criteria = EvaluationCriteria::findOrFail($id);

        $criteria->delete();

        return response()->json([
            'message' => 'Criteria deleted successfully'
        ]);
    }
}