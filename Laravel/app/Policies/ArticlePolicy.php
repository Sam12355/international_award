<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Authorization policy for article CRUD and review operations.
 *
 * Admins bypass all checks via `before()`. For non-admin users:
 * - Authors can only modify their own articles while in "submitted" status.
 * - Reviewers can view any article and change its status.
 * - Deletion is blocked once an article reaches approved/published.
 *
 * @see \App\Models\Article
 */
class ArticlePolicy
{
    /**
     * Grant all abilities to administrators.
     *
     * Returning `null` falls through to the specific policy method;
     * returning `true` authorizes without further checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    /** Any authenticated user may browse the article list. */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Authors see their own articles; reviewers can see any article.
     */
    public function view(User $user, Article $article): bool
    {
        return $user->id === $article->user_id
            || $user->isReviewer();
    }

    /** Any authenticated user may create a new submission. */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Only the author may update, and only while the article is still in "submitted" status.
     */
    public function update(User $user, Article $article): bool
    {
        return $user->id === $article->user_id
            && $article->status === 'submitted';
    }

    /**
     * Only the author may delete, and only before it has been approved/published.
     *
     * TODO: should we allow admins to soft-delete published articles?
     */
    public function delete(User $user, Article $article): bool
    {
        return $user->id === $article->user_id
            && !in_array($article->status, ['approved', 'published']);
    }

    /** Soft-delete restoration is limited to the original author. */
    public function restore(User $user, Article $article): bool
    {
        return $user->id === $article->user_id;
    }

    /** Hard deletion is never permitted through the application. */
    public function forceDelete(User $user, Article $article): bool
    {
        return false;
    }

    /**
     * Reviewers (and admins via before()) can change article status.
     */
    public function review(User $user, Article $article): bool
    {
        return $user->isReviewer();
    }
}
