<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'valuation',
        'ownership_id',
        'owner_percentage',
        'note',
        'contract_documents',
        'cloudinary_public_ids',
        'is_completed',
        'image',
        'cloudinary_image_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'contract_documents' => 'array',
        'cloudinary_public_ids' => 'array',
        'is_completed' => 'boolean',
        'status' => 'boolean',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ownership()
    {
        return $this->belongsTo(Ownership::class);
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
public function incentives() {
    return $this->hasMany(Incentive::class);
}



}
