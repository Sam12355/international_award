<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReviewAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'reviewer_id',
        'status',
        'due_date',
    ];

    protected $casts = [
        'due_date' => 'datetime',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /* ------------------------------------------------------------------ */
    /*  Scopes                                                             */
    /* ------------------------------------------------------------------ */

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
