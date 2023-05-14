<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Links a reviewer to an article for peer review.
 *
 * @property int    $id
 * @property int    $article_id
 * @property int    $reviewer_id
 * @property string $status       pending | completed
 * @property \Illuminate\Support\Carbon|null $due_date
 * @property \Illuminate\Support\Carbon       $created_at
 * @property \Illuminate\Support\Carbon       $updated_at
 *
 * @property-read Article $article
 * @property-read User    $reviewer
 *
 * @method static Builder|ReviewAssignment pending()
 */
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

    /** Get the article being reviewed. */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /** Get the user assigned as reviewer. */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /* ------------------------------------------------------------------ */
    /*  Scopes                                                             */
    /* ------------------------------------------------------------------ */

    /**
     * Scope: only assignments still awaiting completion.
     *
     * @param  Builder<ReviewAssignment> $query
     * @return Builder<ReviewAssignment>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }
}
