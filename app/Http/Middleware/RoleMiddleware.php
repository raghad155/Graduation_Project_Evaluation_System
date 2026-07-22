<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $role)
    {
        $user = Auth::user();

        // هل المستخدم مسجل دخول؟
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // السماح للمدير (admin) بتجاوز الصلاحيات وتعديل كافة النماذج
        if ($user->roles()->where('name', 'admin')->exists()) {
            return $next($request);
        }

        // هل عنده أي دور من الأدوار المطلوبة (يدعم الفصل برمز | مثل admin|committee_head)
        $roles = explode('|', $role);
        if (!$user->roles()->whereIn('name', $roles)->exists()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return $next($request);
    }
}