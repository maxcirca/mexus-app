/**
 * Database setup the API runs at start-up. Idempotent: safe on every deploy.
 *
 * Read-only login (docs/ACCESS.md, TablePlus): the user `mexus_readonly` may
 * read the app's database and nothing else, and can't change data or
 * structure (readonly = 2 still lets clients adjust query settings). Its
 * password comes from the MEXUS_READONLY_PASSWORD variable, which Max sets
 * in Railway. ClickHouse can't bind parameters in CREATE USER, so the
 * password is spliced in, and only after it passed the strict check below.
 */
export const READONLY_USER = "mexus_readonly";

export type Run = (sql: string) => Promise<unknown>;

const safePassword = /^[A-Za-z0-9]{24,128}$/;

export function readonlyUserStatements(database: string, password: string): string[] {
  if (!safePassword.test(password)) {
    throw new Error("MEXUS_READONLY_PASSWORD must be 24 to 128 letters and digits");
  }
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error(`Unexpected database name: ${database}`);
  }
  const identified = `IDENTIFIED WITH sha256_password BY '${password}'`;
  return [
    `CREATE USER IF NOT EXISTS ${READONLY_USER} ${identified} SETTINGS readonly = 2`,
    `ALTER USER ${READONLY_USER} ${identified} SETTINGS readonly = 2`,
    `GRANT SELECT ON ${database}.* TO ${READONLY_USER}`,
  ];
}

/** Errors can echo the failed statement; never let the password reach a log. */
export function redact(message: string, secret: string | undefined): string {
  return secret ? message.split(secret).join("***") : message;
}

export async function setupDatabase(run: Run, env: NodeJS.ProcessEnv): Promise<string[]> {
  const done: string[] = [];
  const password = env.MEXUS_READONLY_PASSWORD;
  if (password) {
    try {
      for (const sql of readonlyUserStatements(env.CLICKHOUSE_DB || "mexus", password)) await run(sql);
    } catch (error) {
      throw new Error(redact(error instanceof Error ? error.message : String(error), password));
    }
    done.push(`read-only user ${READONLY_USER} ready`);
  } else {
    done.push("no MEXUS_READONLY_PASSWORD: read-only user skipped");
  }
  return done;
}
