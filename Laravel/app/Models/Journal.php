<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A scientific journal that accepts article submissions.
 *
 * Journals can be deactivated (`is_active = false`) to stop new submissions
 * without removing historical data.
 *
 * @property int    $id
 * @property string $name
 * @property string $description
 * @property string $issn          International Standard Serial Number
 * @property bool   $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<Article> $articles
 *
 * @method static Builder|Journal active()
 */
class Journal extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'issn',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    /** Get all articles submitted to this journal. */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    /* ------------------------------------------------------------------ */
    /*  Scopes                                                             */
    /* ------------------------------------------------------------------ */

    /**
     * Scope: only journals currently accepting submissions.
     *
     * @param  Builder<Journal> $query
     * @return Builder<Journal>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
