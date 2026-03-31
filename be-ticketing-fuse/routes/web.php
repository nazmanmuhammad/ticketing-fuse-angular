<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;

Route::get('/', function () {
    // \Log::info('Test mail sent');
    // Mail::to('nurulazman2002@gmail.com')->send(new \App\Mail\TestMail());
    return view('welcome');
});
