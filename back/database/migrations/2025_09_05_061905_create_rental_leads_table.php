<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('gender')->nullable();
            $table->string('contact')->nullable();
            $table->string('nid')->nullable();
            $table->decimal('monthly_salary',15,2)->nullable();
            $table->string('occupation')->nullable();
            $table->text('background_history')->nullable();
            $table->string('image')->nullable();
            $table->string('cloudinary_image_id')->nullable();
            $table->json('documents')->nullable(); // multiple images
            $table->json('documents_public_ids')->nullable();
            $table->boolean('status')->default(true);
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_leads');
    }
};
