<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a scholarly article submitted for peer review and publication.
 *
 * Each article belongs to a single journal and is authored by one user.
 * Articles progress through a status lifecycle: submitted → under_review →
 * approved/rejected → published.
 *
 * @property int         $id
 * @property int         $user_id
 * @property int         $journal_id
 * @property string      $title
 * @property string      $abstract
 * @property string|null $keywords
 * @property string      $status
 * @property string|null $doi
 * @property string|null $doi_status
 * @property string|null $index_status
 * @property string      $file_path
 * @property int         $file_size
 * @property string      $original_filename
 * @property string|null $reviewer_notes
 * @property \Illuminate\Support\Carbon|null $reviewed_at
 * @property \Illuminate\Support\Carbon|null $published_at
 * @property \Illuminate\Support\Carbon      $created_at
 * @property \Illuminate\Support\Carbon      $updated_at
 *
 * @property-read User                                          $user
 * @property-read Journal                                       $journal
 * @property-read \Illuminate\Database\Eloquent\Collection<ReviewAssignment> $reviewAssignments
 * @property-read \Illuminate\Database\Eloquent\Collection<ArticleView>      $views
 *
 * @method static Builder|Article status(string $status)
 * @method static Builder|Article published()
 * @method static Builder|Article submittedBefore(\DateTimeInterface|string $date)
 */
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
        'reviewer_notes',
    ];

    protected $casts = [
        'file_size'    => 'integer',
        'reviewed_at'  => 'datetime',
        'published_at' => 'datetime',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    /** Get the author who submitted this article. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Get the journal this article was submitted to. */
    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    /** Get all review assignments for this article. */
    public function reviewAssignments(): HasMany
    {
        return $this->hasMany(ReviewAssignment::class);
    }

    /** Get all view-tracking records for this article. */
    public function views(): HasMany
    {
        return $this->hasMany(ArticleView::class);
    }

    /* ------------------------------------------------------------------ */
    /*  Scopes                                                             */
    /* ------------------------------------------------------------------ */

    /**
     * Scope: filter articles by their workflow status.
     *
     * @param  Builder<Article> $query
     * @param  string           $status  One of: submitted, under_review, approved, rejected, published
     * @return Builder<Article>
     */
    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: only articles that have reached "published" status.
     *
     * @param  Builder<Article> $query
     * @return Builder<Article>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope: articles submitted before a given date.
     *
     * @param  Builder<Article>               $query
     * @param  \DateTimeInterface|string       $date
     * @return Builder<Article>
     */
    public function scopeSubmittedBefore(Builder $query, $date): Builder
    {
        return $query->where('created_at', '<', $date);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * Generate a human-readable reference code (e.g. SJP-01-00042).
     *
     * Format is driven by the `journal.reference_format` config value.
     */
    public function reference(): string
    {
        return sprintf(config('journal.reference_format', 'SJP-%02d-%05d'), $this->journal_id, $this->id);
    }

    /** Check whether this article has been approved by a reviewer. */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /** Check whether this article has been published with a DOI. */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
