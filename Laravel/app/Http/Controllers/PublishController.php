<?php

namespace App\Http\Controllers;

use App\Exceptions\ExternalApiException;
use App\Models\Article;
use App\Services\CrossRefService;
use App\Services\ScholarIndexingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class PublishController extends Controller
{
    public function __construct(
        private readonly CrossRefService $crossRef,
        private readonly ScholarIndexingService $scholar,
    ) {}

    /**
     * Admin view of approved articles ready to publish.
     */
    public function index(): View
    {
        $articles = Article::with('journal', 'user')
            ->where('status', 'approved')
            ->latest()
            ->paginate(20);

        return view('admin.publish.index', compact('articles'));
    }

    /**
     * Publish an approved article: register DOI + submit for indexing.
     *
     * Partial failures are handled gracefully — if CrossRef or Scholar
     * is down, the article still gets published and the failed step
     * can be retried later.
     */
    public function publish(Request $request, Article $article): RedirectResponse
    {
        if ($article->status !== 'approved') {
            return back()->with('error', 'Only approved articles can be published.');
        }

        $errors = [];

        // Step 1: Register DOI via CrossRef
        // TODO: move this to a queued job so the admin doesn't wait for the API call
        try {
            $doiResult = $this->crossRef->registerDoi($article);
            $article->doi = $doiResult['doi'];
        } catch (ExternalApiException $e) {
            Log::warning('Publish: CrossRef failed, continuing', [
                'article_id' => $article->id,
                'error'      => $e->getMessage(),
            ]);
            $errors[] = 'DOI registration failed — can be retried later.';
        }

        // Step 2: Submit to Google Scholar
        try {
            $this->scholar->submit($article);
        } catch (ExternalApiException $e) {
            Log::warning('Publish: Scholar indexing failed, continuing', [
                'article_id' => $article->id,
                'error'      => $e->getMessage(),
            ]);
            $errors[] = 'Scholar indexing failed — can be retried later.';
        }

        // Step 3: Mark as published
        $article->status = 'published';
        $article->published_at = now();
        $article->save();

        Log::info('Article published', [
            'article_id' => $article->id,
            'doi'        => $article->doi,
        ]);

        $message = 'Article published successfully.';
        if ($errors) {
            $message .= ' Warnings: ' . implode(' ', $errors);
        }

        return redirect()
            ->route('admin.publish.index')
            ->with($errors ? 'warning' : 'success', $message);
    }
}
