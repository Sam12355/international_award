<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Handles DOI registration via the CrossRef deposit API.
 *
 * Replaces the raw cURL POST to CrossRef in legacy publish_article.php,
 * adding proper retry logic, SSL verification, and structured logging.
 */
class CrossRefService
{
    private string $baseUrl;
    private string $username;
    private string $password;

    public function __construct()
    {
        $this->baseUrl  = config('services.crossref.url', 'https://doi.crossref.org/servlet/deposit');
        $this->username = config('services.crossref.username', '');
        $this->password = config('services.crossref.password', '');
    }

    /**
     * Register a DOI for the given article.
     *
     * @return array{doi: string, status: string}
     *
     * @throws \App\Exceptions\ExternalApiException
     */
    public function registerDoi(Article $article): array
    {
        $xml = $this->buildDepositXml($article);

        Log::info('CrossRef: registering DOI', [
            'article_id' => $article->id,
            'reference'  => $article->reference(),
        ]);

        try {
            $response = Http::withBasicAuth($this->username, $this->password)
                ->timeout(30)
                ->retry(3, 500, throw: false)
                ->attach('mdFile', $xml, 'deposit.xml')
                ->post($this->baseUrl, [
                    'operation' => 'doMDUpload',
                    'login_id'  => $this->username,
                    'login_passwd' => $this->password,
                ]);

            if ($response->failed()) {
                Log::error('CrossRef: deposit failed', [
                    'article_id' => $article->id,
                    'status'     => $response->status(),
                    'body'       => $response->body(),
                ]);

                throw new \App\Exceptions\ExternalApiException(
                    'CrossRef deposit failed: HTTP ' . $response->status(),
                );
            }

            $doi = $this->parseDoi($response->body());

            Log::info('CrossRef: DOI registered', [
                'article_id' => $article->id,
                'doi'        => $doi,
            ]);

            return ['doi' => $doi, 'status' => 'registered'];

        } catch (RequestException $e) {
            Log::error('CrossRef: request exception', [
                'article_id' => $article->id,
                'message'    => $e->getMessage(),
            ]);

            throw new \App\Exceptions\ExternalApiException(
                'CrossRef request failed: ' . $e->getMessage(),
                previous: $e,
            );
        }
    }

    /**
     * Build the CrossRef deposit XML payload.
     */
    private function buildDepositXml(Article $article): string
    {
        $article->load('journal', 'user');

        $timestamp = now()->format('YmdHis');
        $batchId   = 'batch-' . $article->id . '-' . $timestamp;
        $doiSuffix = strtolower($article->journal->issn ?? 'journal') . '.' . $article->id;

        return <<<XML
        <?xml version="1.0" encoding="UTF-8"?>
        <doi_batch version="4.4.2" xmlns="http://www.crossref.org/schema/4.4.2">
            <head>
                <doi_batch_id>{$batchId}</doi_batch_id>
                <timestamp>{$timestamp}</timestamp>
                <depositor>
                    <depositor_name>{$this->username}</depositor_name>
                </depositor>
            </head>
            <body>
                <journal>
                    <journal_article publication_type="full_text">
                        <titles>
                            <title>{$this->escapeXml($article->title)}</title>
                        </titles>
                        <contributors>
                            <person_name sequence="first" contributor_role="author">
                                <given_name>{$this->escapeXml($article->user->name)}</given_name>
                            </person_name>
                        </contributors>
                        <doi_data>
                            <doi>10.47281/{$doiSuffix}</doi>
                            <resource>{$this->escapeXml(url('/articles/' . $article->id))}</resource>
                        </doi_data>
                    </journal_article>
                </journal>
            </body>
        </doi_batch>
        XML;
    }

    private function parseDoi(string $responseBody): string
    {
        // CrossRef returns the DOI in the success response
        if (preg_match('/doi:\s*(10\.\S+)/i', $responseBody, $matches)) {
            return $matches[1];
        }

        return 'pending';
    }

    private function escapeXml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
