<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Floor extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'floor_name',
        'floor_plan_image',
        'cloudinary_public_id',
        'status',
        'user_id',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // 🔗 Relations
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function units()
{
    return $this->hasMany(Unit::class);
}

}
