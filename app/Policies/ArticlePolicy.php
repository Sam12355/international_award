<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ArticlePolicy
{
    /**
     * Admins can do anything.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Article $article): bool
    {
        // Authors see their own; reviewers see articles assigned to them
        return $user->id === $article->user_id
            || $user->isReviewer();
    }

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

    public function restore(User $user, Article $article): bool
    {
        return $user->id === $article->user_id;
    }

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
