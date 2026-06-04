<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_type_id',
        'amount',
        'notes',
        'expense_id',
        'procurement_id',
        'type',
        'payroll_id',
        'installment_id',
        'incentive_id',
        'sale_id',
        'rental_id',
        'rental_installment_id',
        'image',
        'cloudinary_public_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // 🔗 Relations
    public function user() { return $this->belongsTo(User::class); }
    public function paymentType() { return $this->belongsTo(PaymentType::class); }
    public function expense() { return $this->belongsTo(Expense::class); }
    public function procurement() { return $this->belongsTo(Procurement::class); }
    public function payroll() { return $this->belongsTo(Payroll::class); }
    public function installment() { return $this->belongsTo(Installment::class); }
    public function incentive() { return $this->belongsTo(Incentive::class); }
    public function sale() { return $this->belongsTo(Sale::class); }
    public function rental() { return $this->belongsTo(RentalUnit::class, 'rental_id'); }
    public function rentalInstallment() { return $this->belongsTo(RentalInstallment::class); }
}
