<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Submits articles to the Google Scholar indexing endpoint.
 *
 * Replaces the raw cURL JSON POST in legacy publish_article.php,
 * adding retry logic, proper error handling, and logging.
 */
class ScholarIndexingService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.scholar.url', 'https://scholar.google.com/scholar_indexing');
        $this->apiKey  = config('services.scholar.api_key', '');
    }

    /**
     * Submit the article metadata for indexing.
     *
     * @return array{indexed: bool, message: string}
     *
     * @throws \App\Exceptions\ExternalApiException
     */
    public function submit(Article $article): array
    {
        $article->load('journal', 'user');

        $payload = [
            'title'    => $article->title,
            'author'   => $article->user->name,
            'journal'  => $article->journal->name ?? '',
            'year'     => $article->created_at->year,
            'doi'      => $article->doi ?? '',
            'abstract' => $article->abstract,
            'url'      => url('/articles/' . $article->id),
        ];

        Log::info('Scholar: submitting article for indexing', [
            'article_id' => $article->id,
        ]);

        try {
            $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Accept'        => 'application/json',
                ])
                ->timeout(30)
                ->retry(3, 1000, throw: false)
                ->post($this->baseUrl, $payload);

            if ($response->failed()) {
                Log::error('Scholar: indexing failed', [
                    'article_id' => $article->id,
                    'status'     => $response->status(),
                    'body'       => $response->body(),
                ]);

                throw new \App\Exceptions\ExternalApiException(
                    'Scholar indexing failed: HTTP ' . $response->status(),
                );
            }

            Log::info('Scholar: article indexed', [
                'article_id' => $article->id,
                'response'   => $response->json(),
            ]);

            return [
                'indexed' => true,
                'message' => $response->json('message', 'Submitted for indexing'),
            ];

        } catch (RequestException $e) {
            Log::error('Scholar: request exception', [
                'article_id' => $article->id,
                'message'    => $e->getMessage(),
            ]);

            throw new \App\Exceptions\ExternalApiException(
                'Scholar indexing request failed: ' . $e->getMessage(),
                previous: $e,
            );
        }
    }
}
