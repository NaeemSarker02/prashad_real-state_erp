<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalProject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','location','valuation','rental_ownership_id',
        'owner_percentage','notes','image','cloudinary_image_id',
        'contract_documents','contract_public_ids','type',
        'is_completed','status','user_id'
    ];

    protected $casts = [
        'contract_documents' => 'array',
        'contract_public_ids' => 'array',
        'is_completed' => 'boolean',
        'status' => 'boolean',
    ];

    public function rentalOwnership()
    {
        return $this->belongsTo(RentalOwnership::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function rentalFloors()
    {
        return $this->hasMany(RentalFloor::class);
    }
public function rentalUnits()
{
    return $this->hasMany(RentalUnit::class);
}

}
