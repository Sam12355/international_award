<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateArticleStatusRequest;
use App\Models\Article;
use App\Notifications\ArticleStatusChanged;
use App\Services\ArticleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ArticleService $articleService,
    ) {}

    /**
     * Reviewer dashboard — articles awaiting review.
     */
    public function index(Request $request): View
    {
        $articles = Article::with('journal', 'user')
            ->whereIn('status', config('journal.reviewable_statuses', ['submitted', 'under_review']))
            ->latest()
            ->paginate(20);

        // TODO: filter by reviewer assignment once we enforce assignment workflow

        return view('review.index', compact('articles'));
    }

    /**
     * Show a single article for review with status-change form.
     */
    public function show(Article $article): View
    {
        $this->authorize('review', $article);

        $article->load('journal', 'user', 'reviewAssignments.reviewer');

        return view('review.show', compact('article'));
    }

    /**
     * Update the article status (approve / reject / mark under review).
     */
    public function updateStatus(UpdateArticleStatusRequest $request, Article $article): RedirectResponse
    {
        $this->authorize('review', $article);

        $previousStatus = $article->status;

        $this->articleService->updateStatus(
            $article,
            $request->validated('status'),
            $request->validated('reviewer_notes'),
        );

        // Notify the author about the status change
        $article->user->notify(new ArticleStatusChanged($article, $previousStatus));

        return redirect()
            ->route('review.show', $article)
            ->with('success', 'Article status updated to: ' . $article->status);
    }
}
