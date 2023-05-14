<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates reviewer-initiated status updates on articles.
 *
 * Authorization is handled inline — only users with reviewer or admin
 * roles may issue this request.
 *
 * @see \App\Services\ArticleService::updateStatus()
 */
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
     * Get the validation rules for status transitions.
     *
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
