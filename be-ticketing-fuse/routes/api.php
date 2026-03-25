<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('users/export', [UserController::class, 'export']);
Route::get('departments/export', [DepartmentController::class, 'export']);
Route::get('teams/export', [TeamController::class, 'export']);
Route::resource('users', UserController::class);
Route::resource('departments', DepartmentController::class);
Route::resource('teams', TeamController::class);
Route::post('teams/add-user', [TeamController::class, 'addUser']);
Route::post('login-validation', [AuthController::class, 'loginValidation']);
Route::get('me-validation', [AuthController::class, 'meValidation']);
