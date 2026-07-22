<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;

class SupervisorController extends Controller
{

    // جلب جميع المشرفين
    public function index()
    {
        $supervisors = User::whereHas('roles', function($q){
            $q->where('name','supervisor');
        })
        ->with('roles')
        ->get();

        return response()->json($supervisors);
    }


    // إضافة مشرف
    public function store(Request $request)
    {
        $request->validate([
            'fullName'           => 'required|string|max:255',
            'phoneNumber'        => ['required', 'regex:/^7[0-9]{8}$/'],
            'department'         => 'nullable',
            'specialization_id'  => 'nullable',
        ]);

        $specializationId = $request->input('specialization_id', $request->input('department'));

        // نولّد إيميلاً فريداً إذا لم يُرسله المستخدم
        $email = $request->email ?? 'supervisor_' . uniqid() . '@system.local';

        $user = User::create([
            'full_name'         => $request->fullName,
            'phone_number'      => $request->phoneNumber,
            'specialization_id' => $specializationId,
            'email'             => $email,
            'password'          => bcrypt('123456'),
        ]);

        $role = Role::where('name', 'supervisor')->first();

        if ($role) {
            $user->roles()->attach($role->id);
        }

        return response()->json([
            'message' => 'Supervisor created successfully',
            'user'    => $user->load('roles'),
        ], 201);
    }


    // عرض مشرف واحد
    public function show($id)
    {
        $supervisor = User::whereHas('roles', function($q){

            $q->where(
                'name',
                'supervisor'
            );

        })
        ->with('roles')
        ->findOrFail($id);

        return response()->json(
            $supervisor
        );
    }


    // تعديل مشرف
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'fullName'           => 'required|string|max:255',
            'phoneNumber'        => ['required', 'regex:/^7[0-9]{8}$/'],
            'department'         => 'nullable',
            'specialization_id'  => 'nullable',
        ]);

        $specializationId = $request->input('specialization_id', $request->input('department'));

        $user->update([
            'full_name'         => $request->fullName,
            'phone_number'      => $request->phoneNumber,
            'specialization_id' => $specializationId,
        ]);

        return response()->json([
            'message' => 'Supervisor updated successfully',
            'user'    => $user->load('roles')
        ]);
    }


    // حذف مشرف
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        $role = Role::where(
            'name',
            'supervisor'
        )->first();

        if($role){

            $user->roles()->detach(
                $role->id
            );

        }

        $user->delete();

        return response()->json([

            'message'=>'Supervisor deleted successfully'

        ]);
    }

}
