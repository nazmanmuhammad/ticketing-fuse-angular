<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait Uuid
{
    protected static function bootUuid()
    {
        static::creating(function ($model) {
            try {
                $model->id = (string) Str::uuid7();
            } catch (\Throwable $th) {
                abort(500, $th->getMessage());
            }
        });
    }
}
