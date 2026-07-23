<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\EvaluationScore;
use App\Models\Evaluation;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\EvaluationItem;
use App\Models\ProjectScore;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ResultsExport;


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
}

public function projectReport($id)
{
    $project = Project::with([
        'students',
        'evaluations.scores.criteria'
    ])->findOrFail($id);

    $studentsReport = [];

    foreach ($project->students as $student) {

        $total = 0;
        $scoresArray = [];

        foreach ($project->evaluations as $evaluation) {

            foreach ($evaluation->scores as $score) {

                if ($score->student_id != $student->id) {
                    continue;
                }

                $weighted = ($score->score * $score->criteria->weight) / 100;

                $total += $weighted;

                $scoresArray[] = [
                    'criteria' => $score->criteria->name,
                    'score' => $score->score,
                    'weight' => $score->criteria->weight,
                    'weighted_score' => round($weighted, 2)
                ];
            }
        }

        $studentsReport[] = [
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'scores' => $scoresArray,
            'final_score' => round($total, 2)
        ];
    }

    return response()->json([
        'project_id' => $project->id,
        'project_title' => $project->title,
        'students' => $studentsReport
    ]);
}


public function allProjectsReport()
{
    $projects = Project::with(['students', 'evaluations'])->get();

    $reports = [];

    foreach ($projects as $project) {

        $total = 0;
        $count = $project->evaluations->count();

        foreach ($project->evaluations as $evaluation) {
            $total += $evaluation->final_score ?? 0;
        }

        $avg = $count > 0 ? $total / $count : 0;

        $reports[] = [
            'project_id' => $project->id,
            'project_title' => $project->title,
            'students_count' => $project->students->count(),
            'average_score' => round($avg, 2)
        ];
    }

    return response()->json($reports);
}

public function projectsWithEvaluations()
{
    $projects = Project::with([
        'students',
        'evaluations.scores.criteria'
    ])->get();

    $result = [];

    foreach ($projects as $project) {

        $evaluationsList = [];

        foreach ($project->evaluations as $evaluation) {

            $scores = [];

            foreach ($evaluation->scores as $score) {
                $scores[] = [
                    'criteria' => $score->criteria->name,
                    'score' => $score->score
                ];
            }

            $evaluationsList[] = [
                'evaluation_id' => $evaluation->id,
                'student_id' => $evaluation->student_id ?? null,
                'scores' => $scores
            ];
        }

        $result[] = [
            'project_id' => $project->id,
            'project_title' => $project->title,
            'students_count' => $project->students->count(),
            'evaluations' => $evaluationsList
        ];
    }

    return response()->json($result);
}

public function calculateFinalScores($id)
{
    $project = Project::with([
        'students',
        'evaluations.scores.criteria'
    ])->findOrFail($id);

    $results = [];

    foreach ($project->students as $student) {

        $total = 0;

        foreach ($project->evaluations as $evaluation) {

            foreach ($evaluation->scores as $score) {

                if ($score->student_id != $student->id) {
                    continue;
                }

                $weight = $score->criteria->weight ?? 0;

                $total += ($score->score * $weight) / 100;
            }
        }

        $results[] = [
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'final_score' => round($total, 2)
        ];
    }

    return response()->json([
        'project_id' => $project->id,
        'project_title' => $project->title,
        'students' => $results
    ]);
}

public function exportAllExcel()
{
    return Excel::download(
        new ResultsExport(null),
        'all_projects.xlsx'
    );
}
 public function exportProjectExcel($id)
{
    $project = Project::findOrFail($id);

    $fileName = str_replace(' ','_',$project->title);

    return Excel::download(
        new ResultsExport($id),
        $fileName.'.xlsx'
    );
}


  public function exportProjectPdf($id)
  {
      $project = Project::with([
          'students',
          'evaluations.scores.criteria'
      ])->findOrFail($id);

      $evaluatorsCount = $project->evaluations->count();

      $html = '
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px;">
          <h1 style="color: #2c3e50; border-bottom: 2px solid #ddd; padding-bottom: 10px;">تقرير النتيجة النهائية للمشروع</h1>
          <h2 style="color: #34495e;">اسم المشروع: '.$project->title.'</h2>
          <p>عدد المقيّمين: <strong>'.$evaluatorsCount.'</strong></p>
          <br>
      ';

      foreach ($project->students as $student) {
          $html .= '
          <div style="margin-bottom: 40px;">
              <h3 style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                  اسم الطالب: '.$student->full_name.'
              </h3>

              <table border="1" width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; text-align: right; margin-top: 10px;">
              <tr style="background-color: #f1f2f6;">
                  <th>معيار التقييم</th>
                  <th>الوزن (%)</th>
                  <th>الدرجة الموزونة (المتوسط)</th>
              </tr>';

          $totalFinalScore = 0;
          $criteriaTotals = [];

          foreach ($project->evaluations as $evaluation) {
              foreach ($evaluation->scores as $score) {
                  if ($score->student_id != $student->id) {
                      continue;
                  }

                  $criteriaId = $score->criteria->id ?? 0;
                  $weight = $score->criteria->weight ?? 0;
                  $weighted = ($score->score * $weight) / 100;

                  if (!isset($criteriaTotals[$criteriaId])) {
                      $criteriaTotals[$criteriaId] = [
                          'criteria_name' => $score->criteria->name ?? 'معيار مجهول',
                          'weight' => $weight,
                          'sum_weighted' => 0,
                      ];
                  }
                  
                  $criteriaTotals[$criteriaId]['sum_weighted'] += $weighted;
              }
          }

          foreach ($criteriaTotals as $ct) {
              $avgWeighted = $evaluatorsCount > 0 ? $ct['sum_weighted'] / $evaluatorsCount : 0;
              $totalFinalScore += $avgWeighted;

              $html .= '
              <tr>
                  <td>'.$ct['criteria_name'].'</td>
                  <td>'.$ct['weight'].'%</td>
                  <td>'.round($avgWeighted, 2).'</td>
              </tr>';
          }

          $html .= '
              <tr>
                  <td colspan="2" style="background-color: #e8f4f8;"><b>الدرجة النهائية الموزونة</b></td>
                  <td style="background-color: #e8f4f8; color: #d35400;"><b>'.round($totalFinalScore, 2).'</b></td>
              </tr>
              </table>
          </div>';
      }

      $html .= '
      </div>';

      $mpdf = new \Mpdf\Mpdf([
          'autoScriptToLang' => true,
          'autoLangToFont' => true,
          'default_font' => 'amiri'
      ]);
      
      $mpdf->WriteHTML($html);
      $pdfContent = $mpdf->Output('', 'S');

      $fileName = str_replace(' ', '_', $project->title);
      return response($pdfContent, 200, [
          'Content-Type' => 'application/pdf',
          'Content-Disposition' => 'attachment; filename="'.$fileName.'.pdf"'
      ]);
  }
  public function exportAllPdf()
  {
      $projects = Project::with(['students'])->get();

      $html = '<table border="1" width="100%" cellpadding="5">
          <tr>
              <th>ID</th>
              <th>Title</th>
          </tr>';

      foreach($projects as $project){
          $html .= '<tr>
              <td>'.$project->id.'</td>
              <td>'.$project->title.'</td>
          </tr>';
      }

      $html .= '</table>';

      $mpdf = new \Mpdf\Mpdf([
          'autoScriptToLang' => true,
          'autoLangToFont' => true,
          'default_font' => 'amiri'
      ]);
      
      $mpdf->WriteHTML($html);
      $pdfContent = $mpdf->Output('', 'S');

      return response($pdfContent, 200, [
          'Content-Type' => 'application/pdf',
          'Content-Disposition' => 'attachment; filename="all_projects.pdf"'
      ]);
  }

public function dashboardStats()
{
    $projectsCount = Project::count();
    $studentsCount = Student::count();
    $supervisorsCount = Supervisor::count();
    $evaluationsCount = Evaluation::count();

    // حساب متوسط الدرجات
    $averageScore = EvaluationScore::avg('score');

    // أعلى وأقل درجة
    $maxScore = EvaluationScore::max('score');
    $minScore = EvaluationScore::min('score');

    return response()->json([
        'projects_count' => $projectsCount,
        'students_count' => $studentsCount,
        'supervisors_count' => $supervisorsCount,
        'evaluations_count' => $evaluationsCount,
        'average_score' => round($averageScore, 2),
        'max_score' => $maxScore,
        'min_score' => $minScore
    ]);
}



public function projectAverages()
{
    $projects = Project::with([
        'students',
        'evaluations.scores.criteria'
    ])->get();

    $data = [];

    foreach ($projects as $project) {

        $totalScore = 0;
        $count = 0;

        foreach ($project->evaluations as $evaluation) {

            foreach ($evaluation->scores as $score) {

                $weight = $score->criteria->weight ?? 0;

                $weightedScore = ($score->score * $weight) / 100;

                $totalScore += $weightedScore;
                $count++;
            }
        }

        $average = $count > 0 ? $totalScore / $count : 0;

        $data[] = [
            'project_id' => $project->id,
            'project_title' => $project->title,
            'students_count' => $project->students->count(),
            'average_score' => round($average, 2)
        ];
    }

    return response()->json([
        'projects' => $data
    ]);


    }

    public function topLowProjects()
    {
        $projects = Project::with([
            'evaluations.scores.criteria',
            'students'
        ])->get();

        $results = [];

        foreach ($projects as $project) {

            $total = 0;
            $count = 0;

            foreach ($project->evaluations as $evaluation) {

                foreach ($evaluation->scores as $score) {
                    $weight = $score->criteria->weight ?? 0;
                    $weighted = ($score->score * $weight) / 100;

                    $total += $weighted;
                    $count++;
                }
            }

            $avg = $count > 0 ? $total / $count : 0;

            $results[] = [
                'project_id' => $project->id,
                'project_title' => $project->title,
                'average_score' => round($avg, 2)
            ];
        }

        $sorted = collect($results)->sortByDesc('average_score')->values();

        return response()->json([
            'highest_project' => $sorted->first(),
            'lowest_project' => $sorted->last(),
            'all_projects' => $sorted
        ]);
    }

    public function chartsData()
    {
        $projects = Project::with([
            'evaluations.scores.criteria'
        ])->get();

        $chartData = [];

        foreach ($projects as $project) {

            $total = 0;
            $count = 0;

            foreach ($project->evaluations as $evaluation) {

                foreach ($evaluation->scores as $score) {
                    $weight = $score->criteria->weight ?? 0;
                    $weighted = ($score->score * $weight) / 100;

                    $total += $weighted;
                    $count++;
                }
            }

            $average = $count > 0 ? $total / $count : 0;

            $chartData[] = [
                'project_name' => $project->title,
                'average_score' => round($average, 2)
            ];
        }

        return response()->json([
            'labels' => collect($chartData)->pluck('project_name'),
            'data' => collect($chartData)->pluck('average_score')
        ]);
    }
}