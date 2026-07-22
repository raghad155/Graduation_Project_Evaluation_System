<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * جلب جميع المستخدمين مع أدوارهم
     */
    public function index()
    {
        $users = User::with('roles')
            ->get()
            ->map(function ($user) {
                $roleNames = $user->roles->pluck('name')->values()->toArray();
                return [
                    'id'           => $user->id,
                    'full_name'    => $user->full_name,
                    'email'        => $user->email,
                    'phone_number' => $user->phone_number,
                    'roles'        => $roleNames,
                    'role'         => $roleNames[0] ?? null, // الدور الأساسي
                    'role_label'   => $this->rolesLabel($roleNames),
                    'created_at'   => $user->created_at?->toDateString(),
                ];
            });

        return response()->json($users);
    }

    /**
     * إنشاء حساب مستخدم جديد مع تحديد الدور/الأدوار
     */
    public function store(Request $request)
    {
        $request->validate([
            'full_name'    => 'required|string|max:255',
            'phone_number' => ['required', 'unique:users,phone_number', 'regex:/^7[0-9]{8}$/'],
            'password'     => 'required|string|min:6',
            'roles'        => 'required|array|min:1',
            'roles.*'      => 'string|in:admin,supervisor,committee_member,committee_head',
            'email'        => 'nullable|email|unique:users,email',
        ]);

        $email = $request->email
            ?? ($request->roles[0] ?? 'user') . '_' . uniqid() . '@system.local';

        $user = User::create([
            'full_name'    => $request->full_name,
            'phone_number' => $request->phone_number,
            'email'        => $email,
            'password'     => Hash::make($request->password),
        ]);

        $roleIds = Role::whereIn('name', $request->roles)->pluck('id');
        $user->roles()->attach($roleIds);

        $roleNames = $user->roles()->pluck('name')->toArray();

        return response()->json([
            'message' => 'User created successfully',
            'user'    => [
                'id'           => $user->id,
                'full_name'    => $user->full_name,
                'email'        => $user->email,
                'phone_number' => $user->phone_number,
                'roles'        => $roleNames,
                'role'         => $roleNames[0] ?? null,
                'role_label'   => $this->rolesLabel($roleNames),
            ],
        ], 201);
    }

    /**
     * تعديل بيانات مستخدم بما فيها تغيير الأدوار
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'full_name'    => 'required|string|max:255',
            'phone_number' => ['required', 'unique:users,phone_number,' . $id, 'regex:/^7[0-9]{8}$/'],
            'roles'        => 'required|array|min:1',
            'roles.*'      => 'string|in:admin,supervisor,committee_member,committee_head',
            'password'     => 'nullable|string|min:6',
            'email'        => 'nullable|email|unique:users,email,' . $id,
        ]);

        $data = [
            'full_name'    => $request->full_name,
            'phone_number' => $request->phone_number,
        ];

        if ($request->filled('email')) {
            $data['email'] = $request->email;
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        // تحديث الأدوار: sync يحذف القديم ويضيف الجديد
        $roleIds = Role::whereIn('name', $request->roles)->pluck('id');
        $user->roles()->sync($roleIds);

        $roleNames = $user->fresh()->roles()->pluck('name')->toArray();

        return response()->json([
            'message' => 'User updated successfully',
            'user'    => [
                'id'           => $user->id,
                'full_name'    => $user->full_name,
                'email'        => $user->email,
                'phone_number' => $user->phone_number,
                'roles'        => $roleNames,
                'role'         => $roleNames[0] ?? null,
                'role_label'   => $this->rolesLabel($roleNames),
            ],
        ]);
    }

    /**
     * حذف حساب مستخدم
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->roles()->detach();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * ترجمة لائحة أدوار للعرض
     */
    private function rolesLabel(array $roles): string
    {
        if (empty($roles)) return 'غير محدد';
        return implode(' + ', array_map(fn($r) => $this->roleLabel($r), $roles));
    }

    /**
     * الترجمة العربية لاسم الدور
     */
    private function roleLabel(?string $role): string
    {
        return match ($role) {
            'admin'            => 'رئيس لجنة مناقشة',
            'supervisor'       => 'مشرف',
            'committee_member' => 'عضو لجنة',
            'committee_head'   => 'رئيس لجنة مناقشة',
            default            => 'غير محدد',
        };
    }
}
