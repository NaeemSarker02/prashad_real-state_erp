<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id', 'installment_amount', 'paid_amount', 'due_amount',
        'due_date', 'receipt_image', 'status', 'user_id', 'notes'
    ];

    protected $casts = [
        'status' => 'string', 
        'receipt_image' => 'array',
        'due_date' => 'date',
    ];

    // 🔗 Relations
    public function sale()
    {
        return $this->belongsTo(Sale::class);
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
