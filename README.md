# Scientific Journal Platform - Legacy to Laravel Migration

This repository demonstrates a **before-and-after migration** of a journal management system from legacy procedural PHP (circa 2015) to Laravel 10.

The vertical slice covers the full article lifecycle: **Submit → Review → Publish & Index**.

---

## Repository Structure

```
Legacy/
├── schema.sql              # Original MyISAM schema (no indexes, no FKs)
├── db_connect.php          # Dual MySQLi connections (master/slave attempt)
├── helpers.php             # Shared utility functions (dead code included)
├── login.php               # Session-based auth with md5 passwords
├── upload_article.php      # Procedural file upload + DB insert
├── review_article.php      # Admin review panel with raw SQL
├── publish_article.php     # cURL calls to CrossRef + Scholar (no retry)
└── Laravel/                # Laravel 10 modernisation
    ├── app/
    │   ├── Http/Controllers/
    │   │   ├── ArticleController.php    # Resource controller with DI
    │   │   ├── ReviewController.php     # Reviewer queue + status updates
    │   │   └── PublishController.php    # Admin publish with API services
    │   ├── Http/Requests/               # Form request validation
    │   ├── Http/Middleware/
    │   │   └── EnsureUserHasRole.php    # Role-based route protection
    │   ├── Models/                      # Eloquent models with relationships
    │   ├── Notifications/               # Queued email notifications
    │   ├── Policies/
    │   │   └── ArticlePolicy.php        # Owner-only edit/delete, admin bypass
    │   ├── Services/
    │   │   ├── ArticleService.php       # Business logic (store, status, delete)
    │   │   ├── CrossRefService.php      # DOI registration with retry
    │   │   └── ScholarIndexingService.php  # Indexing with retry + logging
    │   └── Exceptions/
    │       └── ExternalApiException.php # Structured API error handling
    ├── database/
    │   ├── migrations/                  # InnoDB, foreign keys, indexes
    │   ├── factories/                   # Article + Journal factories
    │   └── seeders/                     # Default journals + admin users
    ├── resources/views/                 # Blade views (Tailwind via Breeze)
    ├── routes/web.php                   # Auth groups, role middleware
    └── tests/
        ├── Feature/                     # Submission + Review integration tests
        └── Unit/                        # Policy unit tests
```

---

## Key Problems in the Legacy Code

| Problem | Legacy | Laravel Solution |
|---------|--------|-----------------|
| **No framework** | Procedural PHP 5.4, raw `$_POST`/`$_FILES` | Laravel 10 with MVC, service container, middleware |
| **SQL injection risk** | `mysqli_real_escape_string` (era-appropriate) | Eloquent ORM, parameterised queries |
| **No validation layer** | Manual `empty()` checks, loose extension matching | Form Request classes with declarative rules |
| **File upload fragility** | `@ini_set('memory_limit')`, `/tmp` workaround, `move_uploaded_file` | `Storage` facade, filesystem abstraction |
| **Mixed concerns** | Auth, upload, DB, email all in one file | Controllers → Services → Models separation |
| **No auth framework** | `md5()` passwords, `$_SESSION` | Laravel Breeze (bcrypt, session guards, CSRF) |
| **MyISAM tables** | No foreign keys, no transactions, `latin1` charset | InnoDB, `utf8mb4`, proper migrations with FKs |
| **No API resilience** | Single cURL call, `CURLOPT_SSL_VERIFYPEER = false` | HTTP client with retry, timeouts, structured logging |
| **No tests** | Zero test coverage | PHPUnit: 52 tests, 127 assertions |
| **Dead code** | Unused functions in `helpers.php` | Clean service classes, no dead code |

---

## Architecture Decisions

### Service Layer Pattern
Business logic lives in `app/Services/`, not in controllers. This:
- Keeps controllers thin (HTTP in/out only)
- Makes logic testable without HTTP overhead
- Allows reuse (e.g. `ArticleService::store()` could be called from an API controller later)

### Form Request Validation
Validation is extracted into dedicated `FormRequest` classes:
- `StoreArticleRequest` - validates submission fields, manuscript file (required on POST, optional on PUT)
- `UpdateArticleStatusRequest` - validates status transitions, authorises reviewer role

### Policy-Based Authorization
`ArticlePolicy` handles all permission logic:
- Authors can only edit/delete their own articles while in `submitted` status
- Reviewers can view all articles and change status
- Admins bypass all checks via `before()` gate

### External API Services
Legacy cURL calls replaced with dedicated service classes:
- `CrossRefService` - DOI registration with XML deposit, 3x retry, structured logging
- `ScholarIndexingService` - JSON submission with Bearer auth, 3x retry
- Both throw `ExternalApiException` for consistent error handling
- Credentials driven by `config/services.php` + `.env`

### Database Design
- Read/write splitting configured in `config/database.php` (sticky reads)
- InnoDB engine for transaction support and foreign key integrity
- Proper indexes on `articles.status`, `articles.user_id`, `users.role`

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

### Running Tests

```bash
php artisan test
```

Uses SQLite in-memory database - no MySQL required for testing.

---

## Commit History

| Date | Commit | Description |
|------|--------|-------------|
| 2015-04 → 2015-07 | Legacy commits | Original procedural PHP code |
| 2023-04-15 | Laravel install | Laravel 10 with Breeze auth |
| 2023-04-18 | DB + Models | Migrations, Eloquent models, seeders |
| 2023-04-19 | Auth + Middleware | Breeze, role middleware, route groups |
| 2023-04-21 | Article submission | Service layer, controller, views, notifications |
| 2023-04-24 | Review feature | Reviewer queue, status updates |
| 2023-04-27 | Publish + APIs | CrossRef + Scholar services with retry |
| 2023-05-02 | Tests | PHPUnit feature + unit tests (52 passing) |

---

## What This Demonstrates

1. **Separation of concerns** - Controllers, services, form requests, policies
2. **Proper DB design** - InnoDB, foreign keys, migrations, read/write split
3. **Modern auth** - Laravel Breeze with role-based middleware
4. **API resilience** - HTTP client with retry, timeouts, structured error handling
5. **Test coverage** - Feature tests for HTTP flows, unit tests for business rules
6. **Queued jobs** - Notifications implement `ShouldQueue`
7. **Clean code** - No dead code, consistent naming, type-safe PHP 8 features
