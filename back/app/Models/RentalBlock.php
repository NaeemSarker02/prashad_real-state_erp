<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalBlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'block_name',
        'rental_project_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function rentalProject()
    {
        return $this->belongsTo(RentalProject::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function rentalUnits()
{
    return $this->hasMany(RentalUnit::class);
}

}
