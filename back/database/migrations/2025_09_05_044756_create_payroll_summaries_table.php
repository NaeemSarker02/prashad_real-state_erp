<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('time'); // DD/MM/YY
            $table->text('notes')->nullable();

            $table->json('receipt_image')->nullable(); // Cloudinary URLs (array)
            $table->json('cloudinary_public_ids')->nullable(); // public ids for deletion

            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->boolean('status')->default(true);

            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_summaries');
    }
};
