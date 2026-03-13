<?php

use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::resource('users', UserController::class);
Route::resource('departments', DepartmentController::class);
Route::resource('teams', TeamController::class);
Route::post('teams/add-user', [TeamController::class, 'addUser']);
