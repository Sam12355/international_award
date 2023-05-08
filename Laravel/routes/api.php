<?php

use App\Http\Controllers\Api\ArticleApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the RouteServiceProvider within the "api"
| middleware group. They are prefixed with /api automatically.
|
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', fn (Request $request) => $request->user());

    Route::apiResource('articles', ArticleApiController::class)
        ->middleware('throttle:api');

    Route::get('/journals', [ArticleApiController::class, 'journals'])
        ->name('api.journals');
});
