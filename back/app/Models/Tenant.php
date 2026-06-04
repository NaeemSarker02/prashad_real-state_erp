<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','email','gender','contact','nid',
        'image','cloudinary_image_id',
        'documents','document_public_ids',
        'status','user_id','rental_lead_id'
    ];

    protected $casts = [
        'status' => 'boolean',
        'documents' => 'array',
        'document_public_ids' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rentalLead()
    {
        return $this->belongsTo(RentalLead::class);
    }
    public function rentalUnits()
{
    return $this->hasMany(RentalUnit::class);
}

}
