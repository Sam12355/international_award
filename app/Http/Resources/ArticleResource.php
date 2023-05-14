<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * JSON API resource for article responses.
 *
 * Provides a consistent, API-safe transformation layer that:
 * - Excludes internal fields (file_path, doi_status, index_status)
 * - Formats dates as ISO 8601 strings
 * - Conditionally includes related resources via `whenLoaded()`
 *
 * @mixin \App\Models\Article
 */
class ArticleResource extends JsonResource
{
    /**
     * Transform the article into an API-safe representation.
     *
     * Deliberately excludes file_path (internal storage path) and
     * system fields like doi_status / index_status.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'reference'         => $this->reference(),
            'title'             => $this->title,
            'abstract'          => $this->abstract,
            'keywords'          => $this->keywords,
            'status'            => $this->status,
            'doi'               => $this->when($this->doi !== null, $this->doi),
            'original_filename' => $this->original_filename,
            'file_size'         => $this->file_size,
            'created_at'        => $this->created_at?->toIso8601String(),
            'reviewed_at'       => $this->reviewed_at?->toIso8601String(),
            'published_at'      => $this->published_at?->toIso8601String(),
            'journal'           => new JournalResource($this->whenLoaded('journal')),
            'user'              => $this->whenLoaded('user', fn () => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'review_assignments' => $this->whenLoaded('reviewAssignments', fn () =>
                $this->reviewAssignments->map(fn ($a) => [
                    'reviewer'  => $a->reviewer?->name,
                    'status'    => $a->status,
                    'due_date'  => $a->due_date?->toIso8601String(),
                ])
            ),
        ];
    }
}
