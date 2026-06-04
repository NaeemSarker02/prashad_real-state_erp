<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'user_id',
        'designation',
        'address',
        'city',
        'date_of_join',
        'salary',
        'bonus_percentage',
        'performance',
        'status',
        'added_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'date_of_join' => 'date',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }
    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
public function units()
{
    return $this->hasMany(Unit::class);
}
public function incentives() {
    return $this->hasMany(Incentive::class);
}
public function sales() { return $this->hasMany(Sale::class); }
public function rentalUnits()
{
    return $this->hasMany(RentalUnit::class);
}

}
