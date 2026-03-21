<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'auroparts_product';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'image', 'product_type', 'identifier', 'parent_id', 'title', 'status', 'images', 'technical_specs', 'variations'
    ];

    protected $casts = [
        'images' => 'array',
        'technical_specs' => 'array',
        'variations' => 'array',
    ];
}

class Media extends Model
{
    use HasFactory;

    protected $table = 'media';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'url', 'thumbnail', 'type', 'size', 'dimensions'
    ];
}

class Setting extends Model
{
    use HasFactory;

    protected $table = 'settings';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'key', 'value'
    ];

    protected $casts = [
        'value' => 'array',
    ];
}

class User extends \Illuminate\Foundation\Auth\User
{
    use \Laravel\Sanctum\HasApiTokens, HasFactory, \Illuminate\Notifications\Notifiable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'email', 'password', 'role'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
}
