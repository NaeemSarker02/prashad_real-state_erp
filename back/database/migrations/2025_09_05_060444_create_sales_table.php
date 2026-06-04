<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();

            // 🔗 Foreign keys
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('unit_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('employee_id')->nullable();

            // 💰 Financial fields
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('down_payment', 15, 2)->default(0);   // no nulls, default 0
            $table->decimal('booking_amount', 15, 2)->default(0); // no nulls, default 0
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('monthly_charges', 15, 2)->default(0);

            // 📅 Installment info
            $table->integer('total_installments')->default(0);
            $table->integer('monthly_paid_on')->nullable();   // e.g. day of month
            $table->integer('total_duration')->default(0);    // months or years

            // ⚡ Status
            $table->string('payment_status')->default('pending'); // pending, paid, partial
            $table->boolean('status')->default(true);

            $table->timestamps();

            // Foreign key constraints
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
