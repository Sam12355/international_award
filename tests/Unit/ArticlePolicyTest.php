<?php

namespace Tests\Unit;

use App\Models\Article;
use App\Models\Journal;
use App\Models\User;
use App\Policies\ArticlePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticlePolicyTest extends TestCase
{
    use RefreshDatabase;

    private ArticlePolicy $policy;
    private Journal $journal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy  = new ArticlePolicy();
        $this->journal = Journal::create([
            'name'      => 'Policy Test Journal',
            'issn'      => '0000-0001',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_do_anything(): void
    {
        $admin   = User::factory()->create(['role' => 'admin']);
        $article = Article::factory()->create(['journal_id' => $this->journal->id]);

        $this->assertTrue($this->policy->before($admin, 'update'));
        $this->assertTrue($this->policy->before($admin, 'delete'));
    }

    public function test_author_can_update_own_submitted_article(): void
    {
        $author  = User::factory()->create(['role' => 'author']);
        $article = Article::factory()->create([
            'user_id'    => $author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->assertTrue($this->policy->update($author, $article));
    }

    public function test_author_cannot_update_approved_article(): void
    {
        $author  = User::factory()->create(['role' => 'author']);
        $article = Article::factory()->create([
            'user_id'    => $author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'approved',
        ]);

        $this->assertFalse($this->policy->update($author, $article));
    }

    public function test_author_cannot_update_other_users_article(): void
    {
        $author  = User::factory()->create(['role' => 'author']);
        $other   = User::factory()->create(['role' => 'author']);
        $article = Article::factory()->create([
            'user_id'    => $other->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->assertFalse($this->policy->update($author, $article));
    }

    public function test_author_can_delete_submitted_article(): void
    {
        $author  = User::factory()->create(['role' => 'author']);
        $article = Article::factory()->create([
            'user_id'    => $author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->assertTrue($this->policy->delete($author, $article));
    }

    public function test_author_cannot_delete_published_article(): void
    {
        $author  = User::factory()->create(['role' => 'author']);
        $article = Article::factory()->create([
            'user_id'    => $author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'published',
        ]);

        $this->assertFalse($this->policy->delete($author, $article));
    }

    public function test_reviewer_can_review(): void
    {
        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $article  = Article::factory()->create(['journal_id' => $this->journal->id]);

        $this->assertTrue($this->policy->review($reviewer, $article));
    }

    public function test_author_cannot_review(): void
    {
        $author  = User::factory()->create(['role' => 'author']);
        $article = Article::factory()->create(['journal_id' => $this->journal->id]);

        $this->assertFalse($this->policy->review($author, $article));
    }

    public function test_reviewer_can_view_any_article(): void
    {
        $reviewer = User::factory()->create(['role' => 'reviewer']);
        $article  = Article::factory()->create(['journal_id' => $this->journal->id]);

        $this->assertTrue($this->policy->view($reviewer, $article));
    }

    public function test_author_can_only_view_own_articles(): void
    {
        $author  = User::factory()->create(['role' => 'author']);
        $other   = User::factory()->create(['role' => 'author']);
        $own     = Article::factory()->create([
            'user_id'    => $author->id,
            'journal_id' => $this->journal->id,
        ]);
        $others  = Article::factory()->create([
            'user_id'    => $other->id,
            'journal_id' => $this->journal->id,
        ]);

        $this->assertTrue($this->policy->view($author, $own));
        $this->assertFalse($this->policy->view($author, $others));
    }
}
