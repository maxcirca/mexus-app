# apps/db-gate — read-only door to ClickHouse

Lets TablePlus (or any ClickHouse HTTP client) reach the database over
HTTPS, but only as the read-only user `mexus_readonly`, which the API
creates at start-up. Every other login is refused before it reaches
ClickHouse, so the main database login is never usable from outside
Railway. Repeated wrong passwords block the caller's address for a while.
ADR-006, docs/ACCESS.md.
