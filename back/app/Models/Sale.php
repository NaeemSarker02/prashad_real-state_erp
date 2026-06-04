<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'unit_id',
        'total_amount',
        'down_payment',
        'booking_amount',
        'paid_amount',
        'monthly_charges',
        'total_installments',
        'monthly_paid_on',
        'total_duration',
        'payment_status',
        'user_id',
        'employee_id',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
        'total_amount' => 'float',
        'down_payment' => 'float',
        'booking_amount' => 'float',
        'paid_amount' => 'float',
        'monthly_charges' => 'float',
    ];

    // 👀 Auto-include due_amount in API JSON
    protected $appends = ['due_amount'];

    /*
    |--------------------------------------------------------------------------
    | 🔗 Relationships
    |--------------------------------------------------------------------------
    */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /*
    |--------------------------------------------------------------------------
    | ⚡ Business Logic
    |--------------------------------------------------------------------------
    */

    /**
     * 🔄 Recalculate paid_amount and payment_status
     */
    public function calculatePaidAmount(): void
    {
        // Always work with safe numeric values
        $down = $this->down_payment ?? 0;
        $booking = $this->booking_amount ?? 0;

        // Add all installment payments
        $installmentsPaid = $this->installments()->sum('paid_amount');

        $this->paid_amount = $down + $booking + $installmentsPaid;

        // Update payment_status dynamically
        if ($this->paid_amount >= $this->total_amount) {
            $this->payment_status = 'paid';
        } elseif ($this->paid_amount > 0) {
            $this->payment_status = 'partial';
        } else {
            $this->payment_status = 'pending';
        }

        $this->save();
    }

    /**
     * 🧮 Dynamic accessor for due_amount (not stored in DB)
     */
    public function getDueAmountAttribute(): float
    {
        $total = $this->total_amount ?? 0;
        $paid = $this->paid_amount ?? 0;

        return max($total - $paid, 0);
    }
}
