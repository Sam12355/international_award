<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
{
    /**
     * Any authenticated user may submit an article.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for article submission.
     *
     * Replaces the loose empty() checks and extension comparisons
     * from the legacy upload_article.php.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'      => ['required', 'string', 'max:255'],
            'journal_id' => ['required', 'exists:journals,id'],
            'abstract'   => ['required', 'string', 'min:50'],
            'keywords'   => ['nullable', 'string', 'max:500'],
            'manuscript'  => ['required', 'file', 'mimes:pdf,doc,docx', "max:{$maxSize}"],
        ];
    }

    /**
     * Custom attribute names for clearer error messages.
     */
    public function attributes(): array
    {
        return [
            'journal_id' => 'journal',
            'manuscript'  => 'manuscript file',
        ];
    }
}
