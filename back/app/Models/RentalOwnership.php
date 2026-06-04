<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalOwnership extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','email','gender','phone','nid',
        'image','cloudinary_image_id',
        'contract_image','contract_image_public_ids',
        'contract_start_date','contract_end_date',
        'status','user_id'
    ];

    protected $casts = [
        'status'=>'boolean',
        'contract_image'=>'array',
        'contract_image_public_ids'=>'array',
        'contract_start_date'=>'date',
        'contract_end_date'=>'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
