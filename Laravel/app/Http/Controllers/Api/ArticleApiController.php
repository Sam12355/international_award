<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticleRequest;
use App\Models\Article;
use App\Models\Journal;
use App\Notifications\ArticleSubmitted;
use App\Services\ArticleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * RESTful JSON API for articles.
 *
 * All endpoints require Sanctum token authentication.
 */
class ArticleApiController extends Controller
{
    public function __construct(
        private readonly ArticleService $articleService,
    ) {}

    /**
     * GET /api/articles
     *
     * List the authenticated user's articles with optional status filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()
            ->articles()
            ->with('journal:id,name');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $articles = $query->latest()->paginate(
            $request->integer('per_page', 15),
        );

        return response()->json([
            'data' => $articles->items(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page'    => $articles->lastPage(),
                'per_page'     => $articles->perPage(),
                'total'        => $articles->total(),
            ],
        ]);
    }

    /**
     * POST /api/articles
     *
     * Submit a new article with manuscript upload.
     */
    public function store(StoreArticleRequest $request): JsonResponse
    {
        $article = $this->articleService->store(
            $request->validated(),
            $request->file('manuscript'),
            $request->user(),
        );

        $request->user()->notify(new ArticleSubmitted($article));

        return response()->json([
            'data'    => $article->load('journal:id,name'),
            'message' => 'Article submitted. Reference: ' . $article->reference(),
        ], 201);
    }

    /**
     * GET /api/articles/{article}
     *
     * Show a single article with relationships.
     */
    public function show(Article $article): JsonResponse
    {
        $this->authorize('view', $article);

        $article->load('journal:id,name', 'user:id,name', 'reviewAssignments.reviewer:id,name');

        return response()->json(['data' => $article]);
    }

    /**
     * PUT /api/articles/{article}
     *
     * Update article metadata (only while status = submitted).
     */
    public function update(StoreArticleRequest $request, Article $article): JsonResponse
    {
        $this->authorize('update', $article);

        $article->update(
            $request->safe()->only(['title', 'abstract', 'keywords', 'journal_id']),
        );

        return response()->json([
            'data'    => $article->fresh('journal:id,name'),
            'message' => 'Article updated.',
        ]);
    }

    /**
     * DELETE /api/articles/{article}
     */
    public function destroy(Article $article): JsonResponse
    {
        $this->authorize('delete', $article);

        $this->articleService->delete($article);

        return response()->json(['message' => 'Article deleted.'], 200);
    }

    /**
     * GET /api/journals
     *
     * List active journals for the submission form dropdown.
     */
    public function journals(): JsonResponse
    {
        $journals = Cache::remember('active_journals', config('journal.journal_cache_ttl', 300), function () {
            return Journal::active()->orderBy('name')->get(['id', 'name', 'issn']);
        });

        return response()->json(['data' => $journals]);
    }
}
