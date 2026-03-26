<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'settings';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'key', 'value', 'created_at'
    ];

    protected $casts = [
        'value' => 'array',
        'created_at' => 'datetime',
    ];
}
