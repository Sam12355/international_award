<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | CrossRef DOI Registration
    |--------------------------------------------------------------------------
    */
    'crossref' => [
        'url'      => env('CROSSREF_URL', 'https://doi.crossref.org/servlet/deposit'),
        'username' => env('CROSSREF_USERNAME'),
        'password' => env('CROSSREF_PASSWORD'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Scholar Indexing
    |--------------------------------------------------------------------------
    */
    'scholar' => [
        'url'     => env('SCHOLAR_URL', 'https://scholar.google.com/scholar_indexing'),
        'api_key' => env('SCHOLAR_API_KEY'),
    ],

];
