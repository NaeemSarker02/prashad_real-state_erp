<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('floor_id');
            $table->unsignedBigInteger('block_id');
            $table->string('name');
            $table->decimal('size', 10, 2);
            $table->decimal('rate_per_sqft', 10, 2)->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->decimal('booking_amount', 15, 2)->nullable();
            $table->decimal('utility', 15, 2)->nullable();
            $table->decimal('incentive_amount', 15, 2)->nullable(); // ✅ new
            $table->text('features')->nullable();
            $table->json('images')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('service_charge', 10, 2)->nullable();
            $table->unsignedBigInteger('ownership_id')->nullable();
            $table->boolean('status')->default(true);
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('sold_by')->nullable();
            $table->boolean('is_cancelled')->default(false);
            $table->string('type')->nullable();
            $table->timestamps();

            // 🔗 Foreign keys
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('floor_id')->references('id')->on('floors')->onDelete('cascade');
            $table->foreign('block_id')->references('id')->on('blocks')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('ownership_id')->references('id')->on('ownerships')->onDelete('set null');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('sold_by')->references('id')->on('employees')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
