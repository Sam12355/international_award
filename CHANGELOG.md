# Changelog

All notable changes to the Scientific Journal Platform.

## [Unreleased]

- Queue-based publish workflow (JRNL-15)
- Bulk article export for admins

## [1.3.0] — 2023-05-12

### Added
- REST API for articles with Sanctum authentication (JRNL-10)
- Postman collection with test scripts
- JMeter load test plan (50 concurrent users)
- Jenkins CI/CD pipeline with staging/production deploy
- Xdebug configuration and VS Code launch profiles
- Rate limiting on API endpoints
- Journal list caching (5 min TTL)
- MIME type validation for manuscript uploads

### Changed
- Moved journal cache TTL to `config/journal.php`
- Article reference format now configurable

## [1.2.0] — 2023-05-05

### Added
- GitHub Actions CI (PHP 8.1/8.2 matrix)
- Laravel Telescope for local/staging debugging
- Project README and contributing guide

## [1.1.0] — 2023-05-02

### Added
- PHPUnit test suite (52 tests, 127 assertions)
- Article submission feature tests
- Review workflow feature tests
- ArticlePolicy unit tests
- Factories for Article, Journal, User

## [1.0.0] — 2023-04-27

### Added
- Article submission with manuscript upload
- Reviewer queue and status management
- Publish workflow with CrossRef DOI registration and Scholar indexing
- Email notifications (submission confirmation, status change)
- Role-based access control (author / reviewer / admin)
- Breeze authentication scaffolding
- Database migrations with read/write split config
- Journal and user seeders
