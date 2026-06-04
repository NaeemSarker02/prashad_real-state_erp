<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ownership extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'gender',
        'email',
        'nid',
        'user_id',
        'image',
        'cloudinary_public_id',
        'contract_image',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
        'contract_image' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function projects()
{
    return $this->hasMany(Project::class);
}
public function units()
    {
        return $this->hasMany(Unit::class);
    }
}
