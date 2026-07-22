<?php

namespace App\Http\Controllers;

use App\Models\EvaluationGroup;
use App\Models\EvaluationCriteria;
use App\Models\EvaluationItem;
use Illuminate\Http\Request;

class EvaluationGroupController extends Controller
{
    /**
     * عرض جميع مجموعات التقييم مع المعايير والبنود التابعة لها.
     */
    public function index(Request $request)
    {
        $query = EvaluationGroup::with(['criteria.items', 'specialization']);
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        return response()->json($query->get());
    }

    /**
     * حفظ مجموعة تقييم جديدة.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'weight' => 'required|integer|min:1|max:100',
            'specialization_id' => 'nullable|exists:specializations,id'
        ]);

        $type = 'committee';
        $user = auth()->user();
        if ($user && $user->roles()->where('name', 'supervisor')->exists()) {
            $type = 'supervisor';
        }

        $group = EvaluationGroup::create([
            'title' => $request->title,
            'description' => $request->description ?? '',
            'weight' => $request->weight,
            'specialization_id' => $request->specialization_id,
            'type' => $request->type ?? $type,
        ]);

        return response()->json($group, 201);
    }

    /**
     * تعديل مجموعة تقييم محددة.
     */
    public function update(Request $request, $id)
    {
        $group = EvaluationGroup::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'weight' => 'required|integer|min:1|max:100',
            'specialization_id' => 'nullable|exists:specializations,id'
        ]);

        $group->update([
            'title' => $request->title,
            'description' => $request->description ?? '',
            'weight' => $request->weight,
            'specialization_id' => $request->specialization_id,
        ]);

        return response()->json($group);
    }

    /**
     * حذف مجموعة تقييم مع جميع معاييرها وبنودها.
     */
    public function destroy($id)
    {
        $group = EvaluationGroup::findOrFail($id);
        $group->delete();

        return response()->json([
            'message' => 'Evaluation group along with its criteria deleted successfully'
        ]);
    }

    /**
     * إضافة معيار تقييم جديد لمجموعة معينة.
     */
    public function storeCriterion(Request $request, $groupId)
    {
        $group = EvaluationGroup::find($groupId);
        if (!$group) {
            return response()->json(['message' => 'EvaluationGroup not found for ID: ' . $groupId], 404);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'weight' => 'required|integer|min:1|max:100',
        ]);

        // نقوم بصياغة حقل title في الواجهات إلى name المطابق لقاعدة البيانات
        $criterion = $group->criteria()->create([
            'name' => $request->title,
            'weight' => $request->weight,
            'description' => '',
        ]);

        return response()->json($criterion, 201);
    }

    /**
     * تعديل معيار التقييم داخل مجموعة معينة.
     */
    public function updateCriterion(Request $request, $groupId, $criterionId)
    {
        $criterion = EvaluationCriteria::where('group_id', $groupId)->findOrFail($criterionId);

        $request->validate([
            'title' => 'required|string|max:255',
            'weight' => 'required|integer|min:1|max:100',
        ]);

        $criterion->update([
            'name' => $request->title,
            'weight' => $request->weight,
        ]);

        return response()->json($criterion);
    }

    /**
     * حذف معيار التقييم داخل مجموعة معينة.
     */
    public function destroyCriterion($groupId, $criterionId)
    {
        $criterion = EvaluationCriteria::where('group_id', $groupId)->findOrFail($criterionId);
        $criterion->delete();

        return response()->json([
            'message' => 'Criterion deleted successfully'
        ]);
    }

    /**
     * استبدال أو تحديث المقاييس والبنود الأربعة التابعة لمعيار محدد.
     */
    public function replaceItems(Request $request, $groupId, $criterionId)
    {
        $criterion = EvaluationCriteria::where('group_id', $groupId)->find($criterionId);
        if (!$criterion) {
            return response()->json(['message' => 'Criterion not found for Group ' . $groupId . ' and ID ' . $criterionId], 404);
        }

        $request->validate([
            'items' => 'required|array|min:4|max:4', // الواجهات تتطلب دائماً إرسال 4 مقاييس
            'items.*.title' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.maxScore' => 'required|integer|min:0',
        ]);

        $incomingItems = $request->items;
        $updatedItemIds = [];

        foreach ($incomingItems as $incoming) {
            // صياغة حقل maxScore المكتوب بنظام camelCase في الواجهات إلى حقل قاعدة البيانات snake_case
            $itemData = [
                'criteria_id' => $criterionId,
                'title' => $incoming['title'],
                'description' => $incoming['description'] ?? '',
                'max_score' => $incoming['maxScore'],
            ];

            if (isset($incoming['id']) && $incoming['id'] > 0) {
                // البند موجود ويحتاج للتحديث
                $item = EvaluationItem::findOrFail($incoming['id']);
                $item->update($itemData);
                $updatedItemIds[] = $item->id;
            } else {
                // البند جديد ونقوم بإنشائه
                $item = EvaluationItem::create($itemData);
                $updatedItemIds[] = $item->id;
            }
        }

        // حذف البنود التي لم ترسل في معايير الاستبدال لتنظيف قاعدة البيانات
        $criterion->items()->whereNotIn('id', $updatedItemIds)->delete();

        // إرجاع البنود المحدثة للواجهات
        $items = $criterion->items()->get();
        return response()->json($items);
    }
    /**
     * Duplicate an entire Evaluation Group
     */
    public function duplicate(EvaluationGroup $evaluationGroup)
    {
        // 1. استنساخ البند الأساسي
        $newGroup = $evaluationGroup->replicate();
        $newGroup->title = $newGroup->title . ' (Copy)';
        $newGroup->save();

        // 2. استنساخ المعايير التابعة له
        foreach ($evaluationGroup->criteria as $criterion) {
            $newCriterion = $criterion->replicate();
            $newCriterion->group_id = $newGroup->id;
            $newCriterion->save();

            // 3. استنساخ العناصر الفرعية
            foreach ($criterion->items as $item) {
                $newItem = $item->replicate();
                $newItem->criteria_id = $newCriterion->id;
                $newItem->save();
            }
        }

        return response()->json([
            'message' => 'Evaluation Group duplicated successfully',
            'group' => $newGroup->load(['criteria.items', 'specialization'])
        ], 201);
    }
}
