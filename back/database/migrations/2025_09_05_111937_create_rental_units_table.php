<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_units', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('rental_project_id');
            $table->unsignedBigInteger('rental_floor_id');
            $table->unsignedBigInteger('rental_block_id');
            $table->string('name');
            $table->decimal('size', 10, 2)->nullable();
            $table->decimal('advance_amount', 12, 2)->nullable();
            $table->decimal('monthly_rent_amount', 12, 2)->nullable();
            $table->string('monthly_paid_on')->nullable();
            $table->date('contract_start')->nullable();
            $table->date('contract_end')->nullable();
            $table->text('utility')->nullable();
            $table->text('features')->nullable();
            $table->string('image')->nullable(); // Cloudinary URL
            $table->boolean('is_active')->default(true);
            $table->boolean('status')->default(true);
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('rented_by')->nullable(); // employee_id
            $table->boolean('is_cancelled')->default(false);
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->decimal('service_charge', 12, 2)->nullable();
            $table->timestamps();

            $table->foreign('rental_project_id')->references('id')->on('rental_projects')->onDelete('cascade');
            $table->foreign('rental_floor_id')->references('id')->on('rental_floors')->onDelete('cascade');
            $table->foreign('rental_block_id')->references('id')->on('rental_blocks')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            $table->foreign('rented_by')->references('id')->on('employees')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_units');
    }
};
