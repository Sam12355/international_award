# Contributing

## Workflow

1. Pick a ticket from the `JRNL` Jira board and move it to **In Progress**
2. Create a branch: `feature/JRNL-xxx-short-desc` (or `bugfix/`, `hotfix/`)
3. Commit using conventional format: `feat(JRNL-xxx): description`
4. Push and open a PR against `develop`
5. Get at least one approval, then squash-merge
6. Move the ticket to **QA**

### Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production (deployed via Jenkins) |
| `develop` | Integration — PRs merge here |
| `feature/JRNL-xxx-*` | New features |
| `bugfix/JRNL-xxx-*` | Bug fixes |
| `hotfix/JRNL-xxx-*` | Urgent production fixes (branch from `main`) |

### Commit Messages

```
feat(JRNL-42): add article submission API endpoint
fix(JRNL-58): handle timeout on large manuscript uploads
```

Types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`

---

## Local Setup

```bash
cd Laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install && npm run build
php artisan serve
```

### Tests

```bash
php artisan test                                    # all tests
php artisan test --filter=ArticleSubmissionTest      # specific class
php artisan test --coverage --min=70                 # coverage (needs Xdebug/PCOV)
```

### Debugging

- **Xdebug**: Copy `docs/xdebug/xdebug.ini` into your `php.ini`, then use the VS Code launch configs in `.vscode/launch.json`
- **Telescope**: `/telescope` (admin-only) — queries, exceptions, jobs, mail

### API Testing

Import `docs/postman/Scientific_Journal_Platform_API.postman_collection.json` into Postman. Generate a Sanctum token via tinker and set the `token` collection variable.

---

## Code Review Checklist

- [ ] Jira ticket ID in branch name and commits
- [ ] Form Request for new validation rules
- [ ] Policy check for new authorization logic
- [ ] Service class for business logic (keep controllers thin)
- [ ] Feature test for happy path + at least one error case
- [ ] No `dd()` or `dump()` left in code
- [ ] Migration runs on fresh DB
- [ ] Docs updated if public API changes
