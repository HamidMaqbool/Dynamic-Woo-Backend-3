<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password'
            ], 403);
        }

        // Fetch role data if available
        $roleData = null;
        if ($user->role && $user->role !== 'admin') {
            $roleData = UserRole::where('name', $user->role)->first();
        }

        $accessConfig = $roleData ? $roleData->access_config : null;

        $permissions = $user->permissions 
            ? $user->permissions 
            : ($accessConfig['permissions'] ?? []);

        $accessibleMenus = $accessConfig['accessible_menus'] ?? null;

        // Using Laravel Sanctum for token generation
        $token = $user->createToken('auro-parts-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => [
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'permissions' => $permissions,
                'accessibleMenus' => $accessibleMenus
            ],
            'token' => $token
        ]);
    }
}
