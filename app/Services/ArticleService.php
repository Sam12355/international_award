<?php

namespace App\Services;

use App\Models\Article;
use App\Models\User;
use App\Notifications\ArticleSubmitted;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ArticleService
{
    /**
     * Store a new article submission with its manuscript file.
     *
     * Wraps file storage + DB insert in a transaction so we don't end up
     * with orphaned files if the insert fails.
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
     * Update the review status of an article.
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
