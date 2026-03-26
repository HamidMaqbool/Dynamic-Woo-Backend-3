<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRole extends Model
{
    protected $table = 'user_roles';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'name', 'description', 'access_config', 'created_at'
    ];

    protected $casts = [
        'access_config' => 'array',
        'created_at' => 'datetime',
    ];
}
