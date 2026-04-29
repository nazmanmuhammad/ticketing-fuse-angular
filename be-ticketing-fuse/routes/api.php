<?php

use App\Http\Controllers\AccessRequestController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TicketController;
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
Route::get('settings/application', [SettingController::class, 'getApplicationSetting']);
Route::post('settings/application', [SettingController::class, 'updateApplicationSetting']);
Route::get('settings/smtp', [SettingController::class, 'getSmtpSetting']);
Route::post('settings/smtp', [SettingController::class, 'updateSmtpSetting']);
Route::get('settings/whatsapp', [SettingController::class, 'getWhatsappSetting']);
Route::post('settings/whatsapp', [SettingController::class, 'updateWhatsappSetting']);
Route::get('tickets/counts', [TicketController::class, 'counts']);
Route::get('tickets/statistics', [TicketController::class, 'statistics']);
Route::resource('tickets', TicketController::class);
Route::get('attachments/{id}/view', [AttachmentController::class, 'view']);
Route::get('attachments/{id}/download', [AttachmentController::class, 'download']);
Route::resource('attachment', AttachmentController::class);
Route::get('comments', [CommentController::class, 'index']);
Route::post('comments', [CommentController::class, 'store']);
Route::put('comments/{id}', [CommentController::class, 'update']);
Route::delete('comments/{id}', [CommentController::class, 'destroy']);

// Approval routes
Route::get('approvals/{id}', [ApprovalController::class, 'show']);
Route::get('approvals/my-approvals', [ApprovalController::class, 'myApprovals']);
Route::put('approval-items/{id}', [ApprovalController::class, 'updateItem']);
Route::post('approval-items/{itemId}/approve', [ApprovalController::class, 'approve']);
Route::post('approval-items/{itemId}/reject', [ApprovalController::class, 'reject']);
Route::post('approvals/{id}/cancel', [ApprovalController::class, 'cancel']);

// Access Request routes
Route::get('access-requests/statistics', [AccessRequestController::class, 'statistics']);
Route::resource('access-requests', AccessRequestController::class);
