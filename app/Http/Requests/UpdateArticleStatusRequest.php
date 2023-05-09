<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleStatusRequest extends FormRequest
{
    /**
     * Only reviewers and admins may update article status.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isReviewer();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status'         => ['required', 'in:submitted,under_review,approved,rejected'],
            'reviewer_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
