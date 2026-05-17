<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Laravel\Sanctum\HasApiTokens;

class AuthController extends Controller
{
public function login(Request $request)
{
    $request->validate([
        'full_name' => 'required',
        'password' => 'required',
    ]);

    $user = User::where('full_name', $request->full_name)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'Invalid credentials'
        ], 401);
    }

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user
    ]);
}

public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out'
    ]);
}
}
