<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Manuscript Upload Limits
    |--------------------------------------------------------------------------
    */
    'max_file_size_kb' => env('MANUSCRIPT_MAX_SIZE_KB', 10240),

    'allowed_extensions' => ['pdf', 'doc', 'docx'],

    /*
    |--------------------------------------------------------------------------
    | Article Reference Format
    |--------------------------------------------------------------------------
    | Used for generating human-readable reference IDs.
    | %d = journal_id, %05d = zero-padded article_id
    */
    'reference_format' => 'SJP-%02d-%05d',

    /*
    |--------------------------------------------------------------------------
    | Review Settings
    |--------------------------------------------------------------------------
    */
    'statuses' => ['submitted', 'under_review', 'approved', 'rejected', 'published'],

    'reviewable_statuses' => ['submitted', 'under_review'],

    /*
    |--------------------------------------------------------------------------
    | Cache TTL (seconds)
    |--------------------------------------------------------------------------
    */
    'journal_cache_ttl' => env('JOURNAL_CACHE_TTL', 300),

];
