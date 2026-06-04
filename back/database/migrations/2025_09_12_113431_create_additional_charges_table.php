<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('additional_charges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id');
            $table->text('notes')->nullable();
            $table->string('type'); // e.g., maintenance, penalty, etc.
            $table->decimal('total_amount', 15, 2);
            $table->date('monthly_paid_on')->nullable();
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('due_amount', 15, 2)->default(0);
            $table->string('status')->default('pending'); // pending, paid, overdue
            $table->timestamps();

            // 🔗 Foreign key
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('additional_charges');
    }
};
