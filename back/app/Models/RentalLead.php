<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalLead extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','email','gender','contact','nid','monthly_salary',
        'occupation','background_history','image','cloudinary_image_id',
        'documents','documents_public_ids','status','user_id'
    ];

    protected $casts = [
        'status'=>'boolean',
        'documents'=>'array',
        'documents_public_ids'=>'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    

}
