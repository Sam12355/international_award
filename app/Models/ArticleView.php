<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tracks individual page views of a published article.
 *
 * Timestamps are managed manually (no created_at/updated_at columns);
 * the `viewed_at` field records when the view occurred.
 *
 * @property int         $id
 * @property int         $article_id
 * @property string      $ip_address
 * @property string|null $user_agent
 * @property \Illuminate\Support\Carbon $viewed_at
 *
 * @property-read Article $article
 */
class ArticleView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'article_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    /** Get the article that was viewed. */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
