<?php

namespace App\Http\Controllers;

use App\Models\EvaluationScore;
use App\Models\Evaluation;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    // عرض جميع التقييمات
    public function index()
    {
        return Evaluation::with([
            'project',
            'evaluator'
        ])->get();
    }

    // إضافة تقييم
public function store(Request $request)
{
    $request->validate([

        'project_id' => 'required|exists:projects,id',

        'user_id' => 'required|exists:users,id',

        'score' => 'required|integer|min:0|max:100',

        'notes' => 'nullable|string|max:500'

    ]);

    $evaluation = Evaluation::create([
        'project_id' => $request->project_id,
        'user_id' => $request->user_id,
        'score' => $request->score,
        'notes' => $request->notes
    ]);

    return response()->json([
        'message' => 'Evaluation created successfully',
        'data' => $evaluation
    ],201);
}
    // تعديل تقييم
public function update(Request $request, $id)
{
    $evaluation = Evaluation::findOrFail($id);

    $request->validate([

        'score' => 'required|integer|min:0|max:100',

        'notes' => 'nullable|string|max:500'

    ]);

    $evaluation->update([
        'score' => $request->score,
        'notes' => $request->notes
    ]);

    return response()->json([
        'message'=>'Evaluation updated successfully',
        'data'=>$evaluation
    ]);
}
    // حذف تقييم
    public function destroy($id)
    {
        $evaluation=Evaluation::findOrFail($id);

        $evaluation->delete();

        return response()->json([
            'message'=>'Evaluation deleted successfully'
        ]);
    }

public function storeScores(Request $request)
{
    $request->validate([

        'evaluation_id'=>'required|exists:evaluations,id',

        'student_id'=>'required|exists:students,id',

        'scores'=>'required|array'
    ]);

    foreach($request->scores as $item){

        EvaluationScore::create([

            'evaluation_id'=>$request->evaluation_id,

            'student_id'=>$request->student_id,

            'criteria_id'=>$item['criteria_id'],

            'score'=>$item['score']

        ]);

    }

    return response()->json([
        'message'=>'Scores saved successfully'
    ]);
}
public function finalScore($evaluation_id, $student_id)
{
    $evaluation = Evaluation::with(['scores.criteria'])
        ->findOrFail($evaluation_id);

    $total = 0;

    foreach ($evaluation->scores as $score) {

        if ($score->student_id != $student_id) {
            continue;
        }

        $weight = $score->criteria->weight;

        $total += ($score->score * $weight) / 100;
    }

    return response()->json([
        'evaluation_id' => $evaluation_id,
        'student_id' => $student_id,
        'final_score' => round($total, 2)
    ]);
}}