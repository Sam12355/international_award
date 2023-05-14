<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates article creation and update requests.
 *
 * Manuscript upload is required for creation (POST) but optional
 * for updates (PUT/PATCH). Maximum file size is driven by the
 * `journal.max_file_size_kb` config value.
 *
 * @see \App\Http\Controllers\ArticleController::store()
 * @see \App\Http\Controllers\Api\ArticleApiController::store()
 */
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
     * Get the validation rules for article submission.
     *
     * Manuscript validation differs by HTTP method — required on POST
     * (new submission), optional on PUT (metadata-only update).
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxSize = config('journal.max_file_size_kb', 10240);

        $manuscriptRule = $this->isMethod('POST')
            ? ['required', 'file', 'mimes:pdf,doc,docx', 'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', "max:{$maxSize}"]
            : ['nullable', 'file', 'mimes:pdf,doc,docx', 'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', "max:{$maxSize}"];

        return [
            'title'      => ['required', 'string', 'max:255'],
            'journal_id' => ['required', 'exists:journals,id'],
            'abstract'   => ['required', 'string', 'min:50'],
            'keywords'   => ['nullable', 'string', 'max:500'],
            'manuscript'  => $manuscriptRule,
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
