# apps/backup — nightly ClickHouse backup to Cloudflare R2

A Railway cron service: runs once a night and exits. It backs up the app's
database with ClickHouse's own `BACKUP … TO S3` into the R2 bucket
`mexus-backups` (EU jurisdiction), under `<environment>/<timestamp>`. Then it
proves the backup is usable: restores it into a scratch database, compares
the row count of every table, and drops the scratch database. A mismatch or
any error fails the run, which shows in Railway.

Variables: `CLICKHOUSE_*` (references to the clickhouse service), and
`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, set by
Max in Railway. Preview environments skip the backup. ADR-006.
