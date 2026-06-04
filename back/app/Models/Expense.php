<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_category_id',
        'note',
        'amount',
        'cash_memo_image',
        'cloudinary_public_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'status' => 'boolean',
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }
    public function transactions()
{
    return $this->hasMany(Transaction::class);
}

}
