<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $table = 'media';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'name', 'url', 'type', 'size', 'dimensions', 'thumbnail', 'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
