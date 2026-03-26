<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DynamicController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/health', function () {
        return response()->json(['status' => 'ok']);
    });

    Route::get('/sidebar', [DynamicController::class, 'getSidebar']);
    Route::get('/schema', [DynamicController::class, 'getSchema']);
    Route::get('/routes', [DynamicController::class, 'getRoutes']);
    Route::get('/dashboard', [DynamicController::class, 'getDashboard']);
    Route::get('/available-permissions', [DynamicController::class, 'getAvailablePermissions']);

    // Media Routes
    Route::get('/media', [MediaController::class, 'index']);
    Route::post('/media', [MediaController::class, 'store']);
    Route::delete('/media/{id}', [MediaController::class, 'destroy']);

    // Settings Routes
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);

    // Roles List
    Route::get('/roles/list', [DynamicController::class, 'getRolesList']);

    // Dynamic CRUD Routes
    Route::prefix('{entity}')->group(function () {
        Route::get('/', [DynamicController::class, 'index']);
        Route::get('/{id}', [DynamicController::class, 'show']);
        Route::post('/', [DynamicController::class, 'store']);
        Route::put('/{id}', [DynamicController::class, 'update']);
        Route::delete('/{id}', [DynamicController::class, 'destroy']);
        Route::post('/bulk-delete', [DynamicController::class, 'bulkDelete']);
    });
});
