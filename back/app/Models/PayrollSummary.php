<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'time',
        'notes',
        'receipt_image',
        'cloudinary_public_ids',
        'total_amount',
        'paid_amount',
        'status',
        'user_id',
    ];

    protected $casts = [
        'receipt_image' => 'array',
        'cloudinary_public_ids' => 'array',
        'time' => 'date',
        'status' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
