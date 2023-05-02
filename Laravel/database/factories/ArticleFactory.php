<?php

namespace Database\Factories;

use App\Models\Journal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Article>
 */
class ArticleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'           => User::factory(),
            'journal_id'        => Journal::factory(),
            'title'             => fake()->sentence(8),
            'abstract'          => fake()->paragraphs(3, true),
            'keywords'          => implode(', ', fake()->words(5)),
            'status'            => 'submitted',
            'file_path'         => 'manuscripts/' . fake()->uuid() . '.pdf',
            'original_filename' => fake()->word() . '.pdf',
            'file_size'         => fake()->numberBetween(102400, 10485760),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => ['status' => 'approved']);
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status'       => 'published',
            'published_at' => now(),
            'doi'          => '10.47281/test.' . fake()->unique()->randomNumber(5),
        ]);
    }

    public function underReview(): static
    {
        return $this->state(fn () => ['status' => 'under_review']);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => 'rejected']);
    }
}
