<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->decimal('valuation',15,2)->nullable();
            $table->unsignedBigInteger('rental_ownership_id');
            $table->decimal('owner_percentage',5,2)->nullable();
            $table->text('notes')->nullable();
            $table->string('image')->nullable();
            $table->string('cloudinary_image_id')->nullable();
            $table->json('contract_documents')->nullable();
            $table->json('contract_public_ids')->nullable();
            $table->string('type')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->boolean('status')->default(true);
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('rental_ownership_id')->references('id')->on('rental_ownerships')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_projects');
    }
};
