<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return redirect()->route('articles.index');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('articles', ArticleController::class);
});

/*
|--------------------------------------------------------------------------
| Reviewer Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:reviewer,admin'])->prefix('review')->name('review.')->group(function () {
    Route::get('/', [ReviewController::class, 'index'])->name('index');
    Route::get('/articles/{article}', [ReviewController::class, 'show'])->name('show');
    Route::patch('/articles/{article}/status', [ReviewController::class, 'updateStatus'])->name('updateStatus');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    // Will be populated in Step 7 (publish + API)
});

require __DIR__.'/auth.php';
