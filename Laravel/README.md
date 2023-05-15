# Scientific Journal Platform - Article Lifecycle Module

> **Note:** This is a vertical slice extracted from our main repository to demonstrate the article submission → review → publish pipeline. I've copied the relevant code and documentation from the full project README and wiki. The production system includes additional modules (user management, editorial board, analytics dashboard, billing, notification preferences) that aren't shown here.

---

## Overview

This module covers the core article lifecycle:

1. **Submit** - Authors upload manuscripts with metadata
2. **Review** - Assigned reviewers evaluate and set status
3. **Publish** - Admins trigger DOI registration (CrossRef) and indexing (Google Scholar)

The legacy PHP implementation (2015) is in the root directory. The Laravel 10 rewrite is under `Laravel/`.

---

## Running Locally

```bash
cd Laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install && npm run build
php artisan serve
```

Default accounts created by the seeder:
- `admin@sjplatform.local` (admin)
- `reviewer@sjplatform.local` (reviewer)

### Tests

```bash
php artisan test
```

SQLite in-memory - no MySQL setup needed.

---

## Architecture (this module)

```
app/
├── Http/Controllers/
│   ├── ArticleController.php         # Author-facing CRUD
│   ├── ReviewController.php          # Reviewer queue + status updates
│   ├── PublishController.php         # DOI registration + indexing
│   └── Api/ArticleApiController.php  # JSON API (Sanctum)
├── Http/Requests/                    # Form request validation
├── Http/Middleware/
│   └── EnsureUserHasRole.php         # Role gate
├── Models/
│   ├── Article.php                   # Core model - 15 fields, scopes, relationships
│   ├── Journal.php
│   ├── ReviewAssignment.php
│   └── ArticleView.php
├── Services/
│   ├── ArticleService.php            # Submission + status logic
│   ├── CrossRefService.php           # DOI registration (XML deposit, 3× retry)
│   └── ScholarIndexingService.php    # Scholar indexing (JSON, 3× retry)
├── Policies/ArticlePolicy.php        # Owner/reviewer/admin auth
├── Notifications/                    # Queued emails
└── Exceptions/ExternalApiException.php
```

### Design Decisions

- **Service layer** - Controllers are thin, business logic lives in `app/Services/`. Reused across web and API controllers.
- **Form Requests** - `StoreArticleRequest` handles manuscript validation (MIME type + extension + size). `UpdateArticleStatusRequest` enforces allowed transitions.
- **Policy auth** - `ArticlePolicy` with `before()` admin bypass. Authors can only edit own articles in `submitted` status.
- **Read/write DB split** - `config/database.php` with sticky reads. Production reads go to replica.
- **External API resilience** - CrossRef and Scholar services retry 3× with timeouts. `ExternalApiException` lets the publish action handle partial failures without blocking.
- **Config** - Domain-specific settings (reference format, allowed statuses, cache TTL) are in `config/journal.php` rather than hardcoded.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/articles` | List articles (`?status=` filter, paginated) |
| `POST` | `/api/articles` | Submit article (multipart w/ manuscript) |
| `GET` | `/api/articles/{id}` | Detail with journal + reviewer relationships |
| `PUT` | `/api/articles/{id}` | Update metadata (submitted status only) |
| `DELETE` | `/api/articles/{id}` | Delete article |
| `GET` | `/api/journals` | Active journals (cached) |

Rate-limited via `throttle:api`. Auth via Sanctum tokens.

Postman collection: `docs/postman/Scientific_Journal_Platform_API.postman_collection.json`

---

## Tooling

| Tool | Location | Purpose |
|------|----------|---------|
| **Postman** | `docs/postman/` | API collection with test scripts for all endpoints + error scenarios |
| **JMeter** | `docs/jmeter/` | Load test plan - 50 concurrent users, 3 endpoints |
| **Xdebug** | `docs/xdebug/` + `.vscode/launch.json` | Step debugging for requests and PHPUnit |
| **Telescope** | `/telescope` (admin only) | Runtime query/exception/job monitoring |
| **GitHub Actions** | `.github/workflows/tests.yml` | PHP 8.1/8.2 test matrix on push/PR |
| **Jenkins** | `Jenkinsfile` | Full pipeline: test → build → deploy (staging auto, prod manual gate) |

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for branching, commit conventions, and the review checklist.
