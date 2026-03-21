<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GenericApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [GenericApiController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/health', [GenericApiController::class, 'health']);
    Route::get('/sidebar', [GenericApiController::class, 'sidebar']);
    Route::get('/dashboard', [GenericApiController::class, 'dashboard']);
    Route::get('/schema', [GenericApiController::class, 'schema']);
    Route::get('/routes', [GenericApiController::class, 'routes']);
    Route::get('/settings', [GenericApiController::class, 'settings']);
    Route::put('/settings', [GenericApiController::class, 'updateSettings']);

    // Dynamic routes for entities
    Route::get('/{entity}', [GenericApiController::class, 'index']);
    Route::get('/{entity}/{id}', [GenericApiController::class, 'show']);
    Route::post('/{entity}', [GenericApiController::class, 'store']);
    Route::put('/{entity}/{id}', [GenericApiController::class, 'update']);
    Route::delete('/{entity}/{id}', [GenericApiController::class, 'destroy']);
    Route::post('/{entity}/bulk-delete', [GenericApiController::class, 'bulkDestroy']);
});
