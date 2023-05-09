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
