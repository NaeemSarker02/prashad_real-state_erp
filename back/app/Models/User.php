<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'contact',
        'gender',
        'nid',
        'role_id',
        'cloudinary_public_id',
        'image',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'status' => 'boolean', // status as true/false
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }
    public function ownerships()
    {
        return $this->hasMany(Ownership::class);
    }


    // User can have many expense categories
    public function expenseCategories()
    {
        return $this->hasMany(ExpenseCategory::class);
    }
    public function paymentTypes()
    {
        return $this->hasMany(PaymentType::class);
    }
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
    public function customers()
    {
        return $this->hasMany(Customer::class);
    }
    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
    public function employees()
    {
        return $this->hasMany(Employee::class, 'user_id');
    }

    public function addedEmployees()
    {
        return $this->hasMany(Employee::class, 'added_by');
    }
    public function payrollSummaries()
    {
        return $this->hasMany(PayrollSummary::class);
    }
public function projects()
{
    return $this->hasMany(Project::class);
}
public function floors()
{
    return $this->hasMany(Floor::class);
}
public function blocks()
{
    return $this->hasMany(Block::class);
}
public function units()
{
    return $this->hasMany(Unit::class);
}
public function procurements()
{
    return $this->hasMany(Procurement::class);
}
public function incentives() {
    return $this->hasMany(Incentive::class);
}
public function sales() { return $this->hasMany(Sale::class); }

public function installments() {
    return $this->hasMany(Installment::class);
}
public function rentalLeads()
{
    return $this->hasMany(RentalLead::class);
}
public function rentalOwnerships()
{
    return $this->hasMany(RentalOwnership::class);
}
public function tenants()
{
    return $this->hasMany(Tenant::class);
}
public function rentalProjects()
{
    return $this->hasMany(RentalProject::class);
}
public function rentalBlocks()
{
    return $this->hasMany(RentalBlock::class);
}
public function rentalFloors()
{
    return $this->hasMany(RentalFloor::class);
}
public function rentalUnits()
{
    return $this->hasMany(RentalUnit::class);
}
public function transactions()
{
    return $this->hasMany(Transaction::class);
}

}
