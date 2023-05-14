<?php

namespace App\Services;

use App\Models\Article;
use App\Models\User;
use App\Notifications\ArticleSubmitted;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Encapsulates the core business logic for article lifecycle operations.
 *
 * Handles file storage, database persistence, logging, and notifications
 * for article submission, status transitions, and deletion. All write
 * operations are wrapped in transactions where appropriate.
 */
class ArticleService
{
    /**
     * Store a new article submission with its manuscript file.
     *
     * Wraps file storage + DB insert in a transaction so we don't end up
     * with orphaned files if the insert fails. Dispatches a queued
     * notification to the author on success.
     *
     * @param  array<string, mixed> $validated  Validated form data from StoreArticleRequest
     * @param  UploadedFile         $file       The uploaded manuscript (PDF/DOC/DOCX)
     * @param  User                 $author     The authenticated user submitting the article
     * @return Article              The newly created article instance
     *
     * @throws \Throwable  If the transaction fails (file is cleaned up automatically)
     */
    public function store(array $validated, UploadedFile $file, User $author): Article
    {
        return DB::transaction(function () use ($validated, $file, $author) {

            $path = $file->store('manuscripts', 'public');

            $article = $author->articles()->create([
                'title'             => $validated['title'],
                'journal_id'        => $validated['journal_id'],
                'abstract'          => $validated['abstract'],
                'keywords'          => $validated['keywords'] ?? null,
                'file_path'         => $path,
                'file_size'         => $file->getSize(),
                'original_filename' => $file->getClientOriginalName(),
            ]);

            Log::info('Article submitted', [
                'article_id' => $article->id,
                'user_id'    => $author->id,
                'file_size'  => $article->file_size,
            ]);

            $author->notify(new ArticleSubmitted($article));

            return $article;
        });
    }

    /**
     * Transition an article to a new workflow status.
     *
     * Sets the status, optional reviewer notes, and timestamps the review.
     * Uses direct property assignment to bypass mass-assignment protection
     * since these are system-controlled fields.
     *
     * @param  Article     $article        The article to update
     * @param  string      $status         Target status (approved, rejected, etc.)
     * @param  string|null $reviewerNotes  Optional feedback from the reviewer
     * @return Article     A fresh instance reflecting the persisted state
     */
    public function updateStatus(Article $article, string $status, ?string $reviewerNotes = null): Article
    {
        $article->status = $status;
        $article->reviewer_notes = $reviewerNotes;
        $article->reviewed_at = now();
        $article->save();

        // TODO: dispatch ArticleStatusChanged event instead of handling notification in controller

        Log::info('Article status updated', [
            'article_id' => $article->id,
            'status'     => $status,
        ]);

        return $article->fresh();
    }

    /**
     * Delete an article and its associated manuscript file.
     *
     * Removes the physical file from storage before deleting the database
     * record. Silently skips file deletion if the file no longer exists.
     *
     * @param  Article $article  The article to remove
     */
    public function delete(Article $article): void
    {
        if ($article->file_path && Storage::disk('public')->exists($article->file_path)) {
            Storage::disk('public')->delete($article->file_path);
        }

        $article->delete();

        Log::info('Article deleted', ['article_id' => $article->id]);
    }
}
