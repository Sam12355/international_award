<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Journal;
use App\Models\User;
use App\Notifications\ArticleStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ArticleReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $reviewer;
    private User $author;
    private Journal $journal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->reviewer = User::factory()->create(['role' => 'reviewer']);
        $this->author   = User::factory()->create(['role' => 'author']);
        $this->journal  = Journal::create([
            'name'      => 'Review Journal',
            'issn'      => '9999-0001',
            'is_active' => true,
        ]);
    }

    public function test_author_cannot_access_review_queue(): void
    {
        $this->actingAs($this->author)
            ->get(route('review.index'))
            ->assertForbidden();
    }

    public function test_reviewer_can_view_review_queue(): void
    {
        Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->actingAs($this->reviewer)
            ->get(route('review.index'))
            ->assertOk()
            ->assertViewIs('review.index')
            ->assertViewHas('articles');
    }

    public function test_reviewer_can_view_article_for_review(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->actingAs($this->reviewer)
            ->get(route('review.show', $article))
            ->assertOk()
            ->assertViewIs('review.show');
    }

    public function test_reviewer_can_approve_article(): void
    {
        Notification::fake();

        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->actingAs($this->reviewer)
            ->patch(route('review.updateStatus', $article), [
                'status'         => 'approved',
                'reviewer_notes' => 'Well-structured research.',
            ])
            ->assertRedirect(route('review.show', $article))
            ->assertSessionHas('success');

        $article->refresh();
        $this->assertEquals('approved', $article->status);
        $this->assertEquals('Well-structured research.', $article->reviewer_notes);

        Notification::assertSentTo($this->author, ArticleStatusChanged::class);
    }

    public function test_reviewer_can_reject_article(): void
    {
        Notification::fake();

        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'under_review',
        ]);

        $this->actingAs($this->reviewer)
            ->patch(route('review.updateStatus', $article), [
                'status'         => 'rejected',
                'reviewer_notes' => 'Insufficient methodology section.',
            ])
            ->assertRedirect(route('review.show', $article));

        $this->assertDatabaseHas('articles', [
            'id'     => $article->id,
            'status' => 'rejected',
        ]);

        Notification::assertSentTo($this->author, ArticleStatusChanged::class);
    }

    public function test_author_cannot_update_article_status(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->actingAs($this->author)
            ->patch(route('review.updateStatus', $article), [
                'status' => 'approved',
            ])
            ->assertForbidden();
    }

    public function test_invalid_status_is_rejected(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->actingAs($this->reviewer)
            ->patch(route('review.updateStatus', $article), [
                'status' => 'invalid_status',
            ])
            ->assertSessionHasErrors('status');
    }

    public function test_admin_can_access_review_queue(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('review.index'))
            ->assertOk();
    }
}
