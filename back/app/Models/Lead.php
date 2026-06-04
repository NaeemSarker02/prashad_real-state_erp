<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'gender',
        'contact',
        'nid',
        'monthly_salary',
        'occupation',
        'background_history',
        'image',
        'cloudinary_public_id',
        'documents',
        'status',
        'user_id',
    ];

    protected $casts = [
        'documents' => 'array',
        'status' => 'boolean',
        'monthly_salary' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

}
