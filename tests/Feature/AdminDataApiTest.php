<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Student;
use App\Models\Project;
use App\Models\Specialization;
use App\Models\EvaluationGroup;
use App\Models\EvaluationItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class AdminDataApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // إنشاء الأدوار المحددة في النظام
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'supervisor']);
        Role::create(['name' => 'committee_head']);
        Role::create(['name' => 'committee_member']);
    }

    /**
     * اختبار جلب حزمة البيانات الإدارية المجمعة بنجاح للمستخدم المسجل دخوله.
     */
    public function test_authenticated_user_can_fetch_admin_data()
    {
        $user = User::create([
            'full_name' => 'Dr. Ahmed',
            'phone_number' => '123456789',
            'password' => bcrypt('password')
        ]);
        $user->roles()->attach(Role::where('name', 'committee_head')->first()->id);

        Sanctum::actingAs($user);

        // إنشاء بعض البيانات لضمان عدم وجود أخطاء في الاستعلام
        $specialization = Specialization::create(['name' => 'Software Engineering']);

        $project = Project::create([
            'title' => 'Project Antigravity',
            'description' => 'Test Project Description',
            'supervisor_id' => $user->id,
            'specialization_id' => $specialization->id
        ]);

        $student = Student::create([
            'full_name' => 'Raghad Student',
            'academic_number' => '441200000',
            'specialization_id' => $specialization->id,
            'user_id' => $user->id,
            'project_id' => $project->id
        ]);

        $response = $this->getJson('/api/admin-data');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'students',
                     'supervisors',
                     'projects',
                     'projectMembers',
                     'evaluationGroups',
                     'projectScores'
                 ]);
    }

    /**
     * اختبار رصد درجات الطلاب للمشاريع بنجاح.
     */
    public function test_user_can_store_project_score()
    {
        $user = User::create([
            'full_name' => 'Dr. Khalid',
            'phone_number' => '987654321',
            'password' => bcrypt('password')
        ]);
        $user->roles()->attach(Role::where('name', 'committee_member')->first()->id);

        Sanctum::actingAs($user);

        $specialization = Specialization::create(['name' => 'Computer Science']);
        $project = Project::create([
            'title' => 'Web App Project',
            'description' => 'Web App Desc',
            'supervisor_id' => $user->id,
            'specialization_id' => $specialization->id
        ]);

        $student = Student::create([
            'full_name' => 'Arwa Student',
            'academic_number' => '441201111',
            'specialization_id' => $specialization->id,
            'user_id' => $user->id,
            'project_id' => $project->id
        ]);

        $group = EvaluationGroup::create([
            'title' => 'Presentation Group',
            'description' => 'Visual presentation',
            'weight' => 20
        ]);

        $criterion = $group->criteria()->create([
            'name' => 'Slide Structure',
            'weight' => 10,
            'description' => 'Structure validation'
        ]);

        $item = EvaluationItem::create([
            'criteria_id' => $criterion->id,
            'title' => 'Excellent Structure',
            'description' => 'Slides are clear',
            'max_score' => 10
        ]);

        $payload = [
            'projectId' => $project->id,
            'studentId' => $student->id,
            'itemId' => $item->id,
            'score' => 10,
            'notes' => 'Great visuals'
        ];

        $response = $this->postJson('/api/project-scores', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'projectId' => $project->id,
                     'studentId' => $student->id,
                     'itemId' => $item->id,
                     'score' => 10,
                     'notes' => 'Great visuals'
                 ]);

        $this->assertDatabaseHas('evaluation_scores', [
            'student_id' => $student->id,
            'item_id' => $item->id,
            'score' => 10,
            'notes' => 'Great visuals'
        ]);
    }

    /**
     * اختبار حظر تعديل مجموعات التقييم لغير رئيس اللجنة.
     */
    public function test_non_committee_head_cannot_modify_evaluation_group()
    {
        $user = User::create([
            'full_name' => 'Committee Member User',
            'phone_number' => '111111111',
            'password' => bcrypt('password')
        ]);
        $user->roles()->attach(Role::where('name', 'committee_member')->first()->id);

        Sanctum::actingAs($user);

        $payload = [
            'title' => 'Forbidden Group',
            'description' => 'Should fail',
            'weight' => 30
        ];

        // يجب أن يرجع خطأ "غير مصرح به" 403
        $response = $this->postJson('/api/evaluation-groups', $payload);
        $response->assertStatus(403);
    }
}
