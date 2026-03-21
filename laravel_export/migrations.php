<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auroparts_product', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('image')->nullable();
            $table->string('product_type')->nullable();
            $table->string('identifier')->nullable();
            $table->string('parent_id')->nullable();
            $table->string('title')->nullable();
            $table->string('status')->default('publish');
            $table->jsonb('images')->nullable();
            $table->jsonb('technical_specs')->nullable();
            $table->jsonb('variations')->nullable();
            $table->timestamps();
        });

        Schema::create('media', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('url');
            $table->string('thumbnail')->nullable();
            $table->string('type')->nullable();
            $table->decimal('size', 15, 2)->nullable();
            $table->string('dimensions')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('key')->unique();
            $table->jsonb('value')->nullable();
            $table->timestamps();
        });

        // Laravel's default users table is usually enough, but we'll adapt it
        Schema::create('users', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('user');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('media');
        Schema::dropIfExists('auroparts_product');
    }
};
