<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Imports\SupervisorsImport;
use Maatwebsite\Excel\Facades\Excel;

class AuthController extends Controller
{

   public function login(Request $request)
{
    $request->validate([
        'username_or_email' => 'required',
        'password' => 'required',
    ]);

    $login = $request->username_or_email;

    // البحث بالاسم أو الإيميل أو رقم الهاتف
    $user = User::where('email', $login)
        ->orWhere('full_name', $login)
        ->orWhere('phone_number', $login)
        ->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'Invalid credentials'
        ], 401);
    }

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'roles' => $user->roles ?? []
        ]
    ]);
}
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out'
        ]);
    }

    private function passwordMatches(string $password, ?string $hashedPassword): bool
    {
        if (!$hashedPassword) {
            return false;
        }

        try {
            return Hash::check($password, $hashedPassword);
        } catch (\RuntimeException $exception) {
            return false;
        }
    }
    public function importSupervisors(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv'
        ]);

        try {
            $beforeCount = \App\Models\User::whereHas('roles', function($q) {
                $q->where('name', 'supervisor');
            })->count();
            Excel::import(new SupervisorsImport, $request->file('file'));
            $afterCount = \App\Models\User::whereHas('roles', function($q) {
                $q->where('name', 'supervisor');
            })->count();

            return response()->json([
                'message' => 'تم استيراد بيانات المشرفين بنجاح.',
                'imported' => $afterCount - $beforeCount,
            ], 200);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Supervisors Import Exception: " . $e->getMessage());
            return response()->json([
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }
}
