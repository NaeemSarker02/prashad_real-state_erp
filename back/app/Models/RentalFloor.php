<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalFloor extends Model
{
    use HasFactory;

    protected $table = 'rental_floors';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'rental_project_id',
        'floor_name',
        'floor_plan_image',
        'status',
        'user_id',
    ];

    /**
     * Get the rental project that owns the floor.
     */
    public function rentalProject()
    {
        return $this->belongsTo(RentalProject::class, 'rental_project_id');
    }

    /**
     * Get the user who created the floor.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope a query to only include active floors.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
