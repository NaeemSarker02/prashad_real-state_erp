<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_project_id',
        'rental_floor_id',
        'rental_block_id',
        'name',
        'size',
        'advance_amount',
        'monthly_rent_amount',
        'monthly_paid_on',
        'contract_start',
        'contract_end',
        'utility',
        'features',
        'image',
        'is_active',
        'status',
        'user_id',
        'rented_by',
        'is_cancelled',
        'tenant_id',
        'service_charge',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'status' => 'boolean',
        'is_cancelled' => 'boolean',
        'contract_start' => 'date',
        'contract_end' => 'date',
    ];

    public function rentalProject()
    {
        return $this->belongsTo(RentalProject::class);
    }

    public function rentalFloor()
    {
        return $this->belongsTo(RentalFloor::class);
    }

    public function rentalBlock()
    {
        return $this->belongsTo(RentalBlock::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function rentedBy()
    {
        return $this->belongsTo(Employee::class, 'rented_by');
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
