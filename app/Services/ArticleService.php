<?php

namespace App\Services;

use App\Models\Article;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ArticleService
{
    /**
     * Store a new article submission with its manuscript file.
     *
     * Replaces the legacy upload_article.php which mixed file handling,
     * raw SQL inserts and email sending in a single procedural script.
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
                'status'            => 'submitted',
            ]);

            Log::info('Article submitted', [
                'article_id' => $article->id,
                'user_id'    => $author->id,
                'file_size'  => $article->file_size,
            ]);

            return $article;
        });
    }

    /**
     * Update the review status of an article.
     *
     * Replaces the raw UPDATE query from review_article.php.
     */
    public function updateStatus(Article $article, string $status, ?string $reviewerNotes = null): Article
    {
        $article->update([
            'status'         => $status,
            'reviewer_notes' => $reviewerNotes,
            'reviewed_at'    => now(),
        ]);

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
