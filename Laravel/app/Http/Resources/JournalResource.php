<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * JSON API resource for journal responses.
 *
 * Returns only public-facing journal metadata (id, name, ISSN).
 * Used in both the article submissions dropdown and nested article responses.
 *
 * @mixin \App\Models\Journal
 */
class JournalResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'   => $this->id,
            'name' => $this->name,
            'issn' => $this->issn,
        ];
    }
}
