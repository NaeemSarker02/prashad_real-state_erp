<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Procurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'notes',
        'amount',
        'receipt_image',
        'status',
        'user_id',
    ];

    protected $casts = [
        'receipt_image' => 'array',
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
    public function procurements()
{
    return $this->hasMany(Procurement::class);
}
public function transactions()
{
    return $this->hasMany(Transaction::class);
}

}
