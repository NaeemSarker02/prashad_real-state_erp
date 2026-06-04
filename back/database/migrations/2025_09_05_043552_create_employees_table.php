<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            
            // Main user this employee is linked to
            $table->unsignedBigInteger('user_id');
            
            $table->string('designation')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->date('date_of_join')->nullable();
            $table->decimal('salary', 12, 2)->default(0);
            $table->decimal('bonus_percentage', 5, 2)->default(0);
            $table->string('performance')->nullable();

            $table->boolean('status')->default(true);

            // Who added this employee (admin/user)
            $table->unsignedBigInteger('added_by');

            $table->timestamps();

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('added_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
