<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'user_id',
        'journal_id',
        'abstract',
        'keywords',
        'file_path',
        'file_size',
        'original_filename',
        'status',
        'reviewer_notes',
        'doi',
        'doi_status',
        'index_status',
        'reviewed_at',
        'published_at',
    ];

    protected $casts = [
        'file_size'    => 'integer',
        'reviewed_at'  => 'datetime',
        'published_at' => 'datetime',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function journal()
    {
        return $this->belongsTo(Journal::class);
    }

    public function reviewAssignments()
    {
        return $this->hasMany(ReviewAssignment::class);
    }

    public function views()
    {
        return $this->hasMany(ArticleView::class);
    }

    /* ------------------------------------------------------------------ */
    /*  Scopes                                                             */
    /* ------------------------------------------------------------------ */

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeSubmittedBefore($query, $date)
    {
        return $query->where('created_at', '<', $date);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    public function reference(): string
    {
        return sprintf(config('journal.reference_format', 'SJP-%02d-%05d'), $this->journal_id, $this->id);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
