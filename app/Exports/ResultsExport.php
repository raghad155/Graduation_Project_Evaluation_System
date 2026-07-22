<?php

namespace App\Exports;

use App\Models\Project;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;


class ResultsExport implements FromCollection, WithHeadings
{
    private $project;

    public function __construct($project)
    {
        $this->project = $project;
    }

    public function collection()
    {
        $data = [];
        $evaluatorsCount = $this->project->evaluations->count();

        foreach ($this->project->students as $student) {
            $totalFinalScore = 0;
            $criteriaTotals = [];

            foreach ($this->project->evaluations as $evaluation) {
                foreach ($evaluation->scores as $score) {
                    if ($score->student_id != $student->id) {
                        continue;
                    }

                    $criteriaId = $score->criteria_id;
                    $weight = $score->criteria->weight ?? 0;
                    $weighted = ($score->score * $weight) / 100;

                    if (!isset($criteriaTotals[$criteriaId])) {
                        $criteriaTotals[$criteriaId] = [
                            'criteria_name' => $score->criteria->name,
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

                $data[] = [
                    'Student' => $student->full_name,
                    'Criteria' => $ct['criteria_name'],
                    'Weight' => $ct['weight'] . '%',
                    'Weighted Score' => round($avgWeighted, 2),
                    'Total Final Score' => round($totalFinalScore, 2),
                ];
            }
        }

        return collect($data);
    }

    public function headings(): array
    {
        return [
            'Student',
            'Criteria',
            'Weight',
            'Weighted Score (Average)',
            'Accumulated Total'
        ];
    }
}