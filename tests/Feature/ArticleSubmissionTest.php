<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Journal;
use App\Models\User;
use App\Notifications\ArticleSubmitted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ArticleSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private User $author;
    private Journal $journal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->author  = User::factory()->create(['role' => 'author']);
        $this->journal = Journal::create([
            'name'      => 'Test Journal',
            'issn'      => '1234-5678',
            'is_active' => true,
        ]);
    }

    public function test_guest_cannot_access_articles(): void
    {
        $this->get(route('articles.index'))->assertRedirect(route('login'));
        $this->get(route('articles.create'))->assertRedirect(route('login'));
    }

    public function test_author_can_view_article_index(): void
    {
        $this->actingAs($this->author)
            ->get(route('articles.index'))
            ->assertOk()
            ->assertViewIs('articles.index');
    }

    public function test_author_can_view_create_form(): void
    {
        $this->actingAs($this->author)
            ->get(route('articles.create'))
            ->assertOk()
            ->assertViewIs('articles.create')
            ->assertViewHas('journals');
    }

    public function test_author_can_submit_article(): void
    {
        Storage::fake('public');
        Notification::fake();

        $file = UploadedFile::fake()->create('manuscript.pdf', 2048, 'application/pdf');

        $response = $this->actingAs($this->author)->post(route('articles.store'), [
            'title'      => 'A Study on Testing',
            'journal_id' => $this->journal->id,
            'abstract'   => 'This paper explores automated testing strategies in great detail for modern applications.',
            'keywords'   => 'testing, PHPUnit, Laravel',
            'manuscript'  => $file,
        ]);

        $article = Article::first();

        $response->assertRedirect(route('articles.show', $article));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('articles', [
            'title'      => 'A Study on Testing',
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->assertNotNull($article->file_path);
        Storage::disk('public')->assertExists($article->file_path);

        Notification::assertSentTo($this->author, ArticleSubmitted::class);
    }

    public function test_article_submission_validates_required_fields(): void
    {
        $this->actingAs($this->author)
            ->post(route('articles.store'), [])
            ->assertSessionHasErrors(['title', 'journal_id', 'abstract', 'manuscript']);
    }

    public function test_article_submission_validates_file_type(): void
    {
        $file = UploadedFile::fake()->create('document.txt', 100, 'text/plain');

        $this->actingAs($this->author)
            ->post(route('articles.store'), [
                'title'      => 'Test',
                'journal_id' => $this->journal->id,
                'abstract'   => 'This abstract is long enough to pass the minimum length validation requirement for testing.',
                'manuscript'  => $file,
            ])
            ->assertSessionHasErrors('manuscript');
    }

    public function test_author_can_view_own_article(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
        ]);

        $this->actingAs($this->author)
            ->get(route('articles.show', $article))
            ->assertOk()
            ->assertViewIs('articles.show');
    }

    public function test_author_can_edit_submitted_article(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->actingAs($this->author)
            ->get(route('articles.edit', $article))
            ->assertOk();

        $this->actingAs($this->author)
            ->put(route('articles.update', $article), [
                'title'      => 'Updated Title',
                'journal_id' => $this->journal->id,
                'abstract'   => 'Updated abstract with enough detail to pass the minimum length validation requirement.',
                'keywords'   => 'updated',
            ])
            ->assertRedirect(route('articles.show', $article));

        $this->assertDatabaseHas('articles', [
            'id'    => $article->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_author_cannot_edit_approved_article(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'approved',
        ]);

        $this->actingAs($this->author)
            ->get(route('articles.edit', $article))
            ->assertForbidden();
    }

    public function test_author_can_delete_submitted_article(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'submitted',
        ]);

        $this->actingAs($this->author)
            ->delete(route('articles.destroy', $article))
            ->assertRedirect(route('articles.index'));

        $this->assertDatabaseMissing('articles', ['id' => $article->id]);
    }

    public function test_author_cannot_delete_published_article(): void
    {
        $article = Article::factory()->create([
            'user_id'    => $this->author->id,
            'journal_id' => $this->journal->id,
            'status'     => 'published',
        ]);

        $this->actingAs($this->author)
            ->delete(route('articles.destroy', $article))
            ->assertForbidden();
    }
}
