<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function loginValidation(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
                'valid' => false,
            ], 200);
        }

        return response()->json([
            'message' => 'User found',
            'valid' => true,
        ], 200);
    }

    public function meValidation(Request $request)
    {
        $request->validate([
            'hris_user_id' => 'nullable|integer',
            'email' => 'nullable|email',
        ]);

        $user = User::query()
            ->when(
                $request->filled('hris_user_id'),
                fn($query) => $query->where('hris_user_id', $request->hris_user_id)
            )
            ->when(
                $request->filled('email'),
                fn($query) => $query->orWhere('email', $request->email)
            )
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
                'valid' => false,
            ], 200);
        }

        return response()->json([
            'message' => 'User found',
            'valid' => true,
            'user' => [
                'id' => $user->id,
                'hris_user_id' => $user->hris_user_id,
                'email' => $user->email,
                'status' => $user->status,
                'role_name' => $user->role_name,
                'department_id' => $user->department_id,
            ],
        ], 200);
    }
}
