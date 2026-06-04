<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdditionalCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'notes',
        'type',
        'total_amount',
        'monthly_paid_on',
        'paid_amount',
        'due_amount',
        'status',
    ];

    protected $casts = [
        'monthly_paid_on' => 'date',
    ];

    // 🔗 Relations
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
