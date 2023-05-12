<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleStatusRequest;
use App\Models\Article;
use App\Models\Journal;
use App\Services\ArticleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class ArticleController extends Controller
{
    public function __construct(
        private readonly ArticleService $articleService,
    ) {}

    /**
     * List the authenticated user's articles.
     */
    public function index(Request $request): View
    {
        $articles = $request->user()
            ->articles()
            ->with('journal')
            ->latest()
            ->paginate(15);

        return view('articles.index', compact('articles'));
    }

    /**
     * Show the article submission form.
     */
    public function create(): View
    {
        $journals = Cache::remember('active_journals', config('journal.journal_cache_ttl', 300), function () {
            return Journal::active()->orderBy('name')->get();
        });

        return view('articles.create', compact('journals'));
    }

    /**
     * Store a new article submission.
     *
     * Validation via StoreArticleRequest; file storage and DB insert
     * delegated to ArticleService.
     */
    public function store(StoreArticleRequest $request): RedirectResponse
    {
        $article = $this->articleService->store(
            $request->validated(),
            $request->file('manuscript'),
            $request->user(),
        );

        return redirect()
            ->route('articles.show', $article)
            ->with('success', 'Article submitted successfully. Reference: ' . $article->reference());
    }

    /**
     * Display a single article.
     */
    public function show(Article $article): View
    {
        $article->load('journal', 'user', 'reviewAssignments.reviewer');

        return view('articles.show', compact('article'));
    }

    /**
     * Show the edit form (for authors to update metadata before review).
     */
    public function edit(Article $article): View
    {
        $this->authorize('update', $article);

        $journals = Journal::active()->orderBy('name')->get();

        return view('articles.edit', compact('article', 'journals'));
    }

    /**
     * Update article metadata.
     */
    public function update(StoreArticleRequest $request, Article $article): RedirectResponse
    {
        $this->authorize('update', $article);

        $article->update($request->safe()->only(['title', 'abstract', 'keywords', 'journal_id']));

        return redirect()
            ->route('articles.show', $article)
            ->with('success', 'Article updated.');
    }

    /**
     * Delete an article.
     */
    public function destroy(Article $article): RedirectResponse
    {
        $this->authorize('delete', $article);

        $this->articleService->delete($article);

        return redirect()
            ->route('articles.index')
            ->with('success', 'Article deleted.');
    }
}
