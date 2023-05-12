<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticleRequest;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\JournalResource;
use App\Models\Article;
use App\Models\Journal;
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

        return ArticleResource::collection($articles)->response();
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

        return (new ArticleResource($article->load('journal')))
            ->additional(['message' => 'Article submitted. Reference: ' . $article->reference()])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/articles/{article}
     *
     * Show a single article with relationships.
     */
    public function show(Article $article): JsonResponse
    {
        $this->authorize('view', $article);

        $article->load('journal', 'user', 'reviewAssignments.reviewer');

        return (new ArticleResource($article))->response();
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

        return (new ArticleResource($article->fresh('journal')))
            ->additional(['message' => 'Article updated.'])
            ->response();
    }

    /**
     * DELETE /api/articles/{article}
     */
    public function destroy(Article $article): JsonResponse
    {
        $this->authorize('delete', $article);

        $this->articleService->delete($article);

        return response()->json(null, 204);
    }

    /**
     * GET /api/journals
     *
     * List active journals for the submission form dropdown.
     */
    public function journals(): JsonResponse
    {
        $journals = Cache::remember('active_journals', config('journal.journal_cache_ttl', 300), function () {
            return Journal::active()->orderBy('name')->get();
        });

        return JournalResource::collection($journals)->response();
    }
}
