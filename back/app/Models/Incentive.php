<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incentive extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'unit_id', 'employee_id', 'percentage', 'amount',
        'payment_status', 'user_id', 'status'
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // 🔗 Relations
    public function project()
    {
        return $this->belongsTo(Project::class);
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
    public function transactions()
{
    return $this->hasMany(Transaction::class);
}
public function units()
    {
        return $this->hasMany(Unit::class);
    }
}
