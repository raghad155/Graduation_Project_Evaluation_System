<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SupervisorController extends Controller
{
 
    public function index()
 {
    return User::whereHas('roles', function ($q) {
        $q->where('name', 'supervisor');
    })->with('roles')->get();
 }  
   public function store(Request $request)
{
                                                                                                                                                                                                                                                                                    $request->validate([
        'full_name' => 'required',
        'phone_number' => 'required',
    ]);

    $user = User::create([
        'full_name' => $request->full_name,
        'phone_number' => $request->phone_number,
        'password' => bcrypt('123456'),
    ]);

    $role = Role::where('name', 'supervisor')->first();

    $user->roles()->attach($role->id);

    return response()->json([
        'message' => 'Supervisor created successfully',
        'user' => $user->load('roles')
    ]);
}
  public function show($id)
{
    return User::whereHas('roles', function ($q) {
        $q->where('name', 'supervisor');
    })->findOrFail($id);
}  
  public function update(Request $request, $id)
{
    $user = User::findOrFail($id);

    $request->validate([
        'full_name' => 'required',
        'phone_number' => 'required',
    ]);

    $user->update([
        'full_name' => $request->full_name,
        'phone_number' => $request->phone_number,
    ]);

    return response()->json([
        'message' => 'Supervisor updated successfully',
        'user' => $user->load('roles')
    ]);
} 

  public function destroy($id)
{
    $user = User::findOrFail($id);

    $role = Role::where('name', 'supervisor')->first();

    $user->roles()->detach($role->id);

    $user->delete();

    return response()->json([
        'message' => 'Supervisor deleted successfully'
    ]);
}  
}
