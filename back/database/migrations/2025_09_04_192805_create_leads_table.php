<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('gender')->nullable();
            $table->string('contact')->nullable();
            $table->string('nid')->nullable();
            $table->decimal('monthly_salary', 15, 2)->nullable();
            $table->string('occupation')->nullable();
            $table->text('background_history')->nullable();
            $table->string('image')->nullable(); // Cloudinary URL
            $table->string('cloudinary_public_id')->nullable(); // For deletion
            $table->json('documents')->nullable(); // array of images
            $table->boolean('status')->default(true);
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
