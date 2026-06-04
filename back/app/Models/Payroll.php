<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'gross_pay',
        'income_tax',
        'provident_fund',
        'others_deduction',
        'net_pay',
        'time',
        'image',
        'cloudinary_public_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'status' => 'boolean',
        'time'   => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
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
