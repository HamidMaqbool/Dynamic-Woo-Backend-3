<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->jsonb('access_config')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('media', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('url');
            $table->string('type');
            $table->string('size');
            $table->string('dimensions')->nullable();
            $table->string('thumbnail')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('key')->unique();
            $table->jsonb('value');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('media');
        Schema::dropIfExists('user_roles');
    }
};
