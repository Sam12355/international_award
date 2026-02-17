<!-- Extracted from wiki: Scientific Journal Platform / Modules / Article Lifecycle -->

# Article Lifecycle Module

Pulled this vertical slice out of the main SJP repo as a standalone code sample. This is just the article submission → review → publish pipeline. The rest of the system (editorial board, analytics, billing, etc.) lives in the main repo and isn't included here. Docs below are from the relevant wiki pages.

---

## 1. Overview

Handles the end-to-end article lifecycle:

| Stage | Actor | What happens |
|-------|-------|--------------|
| Submission | Author | Creates article record, uploads manuscript (PDF/DOCX), associates with a journal |
| Review | Reviewer | Evaluates submission from queue, transitions status (approve / reject) |
| Publication | Admin | Publishes approved articles - registers DOI via CrossRef and indexes on Google Scholar |

## 2. Running This Module

```bash
cd Laravel
composer install
cp .env.example .env        # see .env.example for CrossRef/Scholar credentials
php artisan key:generate
php artisan migrate --seed
npm install && npm run build
php artisan serve
```

Seeded accounts: `admin@sjplatform.local` / `reviewer@sjplatform.local` (password: `password`). New registrations default to `author` role.

Tests: `php artisan test` - runs on SQLite in-memory, no MySQL needed.

## 3. Module Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── ArticleController.php           # Author CRUD
│   │   ├── ReviewController.php            # Reviewer queue & status transitions
│   │   ├── PublishController.php           # DOI + Scholar indexing
│   │   └── Api/ArticleApiController.php    # Sanctum-authenticated REST API
│   ├── Requests/
│   │   ├── StoreArticleRequest.php         # MIME + extension + size validation
│   │   └── UpdateArticleStatusRequest.php
│   └── Middleware/
│       └── EnsureUserHasRole.php
├── Models/
│   ├── Article.php                         # config-driven reference(), scopes
│   ├── Journal.php
│   ├── ReviewAssignment.php
│   └── ArticleView.php
├── Services/
│   ├── ArticleService.php                  # DB::transaction for writes
│   ├── CrossRefService.php                 # 3x retry, XML deposit
│   └── ScholarIndexingService.php          # 3x retry, JSON POST
├── Policies/ArticlePolicy.php              # before() admin bypass
├── Notifications/
│   ├── ArticleSubmitted.php
│   └── ArticleStatusChanged.php
└── Exceptions/ExternalApiException.php
```

## 4. Module Configuration

All article-lifecycle-specific settings live in `config/journal.php`:

| Key | Default | Description |
|-----|---------|-------------|
| `max_file_size_kb` | `10240` | Manuscript upload limit (KB) |
| `allowed_extensions` | `['pdf','doc','docx']` | Permitted file types |
| `reference_format` | `'SJP-%02d-%05d'` | Article reference ID pattern (`journal_id`, `article_id`) |
| `statuses` | `['submitted','under_review','approved','rejected','published']` | Lifecycle states |
| `reviewable_statuses` | `['submitted','under_review']` | Which statuses appear in reviewer queue |
| `journal_cache_ttl` | `300` | Journal list cache TTL (seconds) |

External service credentials (`CROSSREF_*`, `SCHOLAR_*`) and `MANUSCRIPT_MAX_SIZE_KB` / `JOURNAL_CACHE_TTL` are set via `.env` - see `.env.example`.

## 5. API Endpoints

Sanctum-authenticated, rate-limited (`throttle:api`).

| Method | URI | Description |
|--------|-----|-------------|
| `GET` | `/api/articles` | Paginated list, filterable with `?status=` |
| `POST` | `/api/articles` | Create with manuscript upload (`multipart/form-data`) |
| `GET` | `/api/articles/{id}` | Detail with journal, user, reviews |
| `PUT` | `/api/articles/{id}` | Update metadata (only when `submitted`) |
| `DELETE` | `/api/articles/{id}` | Delete |
| `GET` | `/api/journals` | Active journals (cached) |

Postman collection with test scripts: `docs/postman/`

## 6. Tests

| Test Class | Tests | Covers |
|------------|-------|--------|
| `ArticleSubmissionTest` | 9 | CRUD, validation, file upload, auth |
| `ArticleReviewTest` | 8 | Queue, status transitions, role checks |
| `ArticlePolicyTest` | 10 | Policy methods, admin bypass, ownership |

52 total tests, 127 assertions. Parallel execution supported (`php artisan test --parallel`).

## 7. Tooling

| Tool | Location | Notes |
|------|----------|-------|
| Postman | `docs/postman/` | Full collection with error scenario tests |
| JMeter | `docs/jmeter/` | 50-thread load test for API endpoints |
| Xdebug | `docs/xdebug/` + `.vscode/launch.json` | 3 launch configs (listen, serve, PHPUnit) |
| Telescope | `/telescope` | Admin-only, local/staging environments |

## 8. Notes

- Publish handles external API failures gracefully - CrossRef and Scholar fail independently, so partial success is possible
- DB configured with read/write split + sticky reads (`config/database.php`)
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for branching/commit conventions, [CHANGELOG.md](CHANGELOG.md) for release history
