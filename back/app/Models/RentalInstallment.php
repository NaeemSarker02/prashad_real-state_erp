<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalInstallment extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_unit_id',
        'installment_amount',
        'paid_amount',
        'due_amount',
        'receipt_images',
        'status',
        'user_id',
    ];

    protected $casts = [
        'status' => 'boolean',
        'receipt_images' => 'array',
    ];

    public function rentalUnit()
    {
        return $this->belongsTo(RentalUnit::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function transactions()
{
    return $this->hasMany(Transaction::class);
}

}
