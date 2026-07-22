<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * جلب جميع الملاحظات التابعة لمشروع معين عبر تقييماته
     */
    public function index($projectId)
    {
        // نجلب جميع الملاحظات المرتبطة بتقييمات المشروع من مختلف المقيمين مع بيانات كاتب الملاحظة
        $feedbacks = Feedback::whereHas('evaluation', function ($q) use ($projectId) {
            $q->where('project_id', $projectId);
        })->with('user:id,full_name,email,role')->orderBy('created_at', 'asc')->get();

        return response()->json($feedbacks);
    }

    /**
     * إنشاء ملاحظة باستخدام تقييم المستخدم الجاري للمشروع
     */
    public function store(Request $request, $projectId)
    {
        $request->validate([
            'content' => 'required|string|max:1000'
        ]);

        $userId = auth()->id() ?: 1;

        // التحقق من وجود أو إنشاء جلسة تقييم للمقيم الحالي على هذا المشروع
        $evaluation = Evaluation::firstOrCreate([
            'project_id' => $projectId,
            'user_id' => $userId,
        ], [
            'score' => 0,
            'notes' => '',
        ]);

        $feedback = Feedback::create([
            'evaluation_id' => $evaluation->id,
            'user_id' => $userId,
            'content' => $request->content,
        ]);

        // نقوم بإرجاع الملاحظة محملة بمعلومات المستخدم لعرضها في الواجهة فوراً
        return response()->json($feedback->load('user:id,full_name,email,role'), 201);
    }

    /**
     * حذف ملاحظة معينة (يجب التحقق من الصلاحيات إن لزم)
     */
    public function destroy($id)
    {
        $feedback = Feedback::findOrFail($id);

        // إذا أردت التأكد من أن المستخدم يمسح ملاحظته فقط ضع هذا الفحص
        // if ($feedback->user_id !== auth()->id() && auth()->user()->role !== 'admin') abort(403);

        $feedback->delete();

        return response()->json(['message' => 'Feedback deleted successfully']);
    }
}
