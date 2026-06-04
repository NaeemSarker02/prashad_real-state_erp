<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id');
            $table->decimal('installment_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('due_amount', 15, 2)->default(0);
            $table->date('due_date');
            $table->json('receipt_image')->nullable(); // store multiple images as JSON
            $table->string('status')->default('pending'); // 'pending', 'paid', 'overdue'
            $table->unsignedBigInteger('user_id');
            $table->text('notes')->nullable(); // ✅ Added notes
            $table->timestamps();

            // 🔗 Foreign keys
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installments');
    }
};
