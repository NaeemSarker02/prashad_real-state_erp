<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->decimal('valuation', 15, 2)->default(0);

            $table->unsignedBigInteger('ownership_id');
            $table->foreign('ownership_id')->references('id')->on('ownerships')->onDelete('cascade');

            $table->decimal('owner_percentage', 5, 2)->default(0);
            $table->text('note')->nullable();

            $table->json('contract_documents')->nullable();       // Cloudinary URLs
            $table->json('cloudinary_public_ids')->nullable();    // Cloudinary IDs for deletion

            $table->boolean('is_completed')->default(false);

            $table->string('image')->nullable();                  // Cloudinary URL
            $table->string('cloudinary_image_id')->nullable();    // Cloudinary ID for single image

            $table->boolean('status')->default(true);

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
