/**
 * Nightly backup with a restore check (ADR-006: "a nightly BACKUP … TO S3,
 * plus a tested restore").
 *
 * ClickHouse can't bind parameters inside BACKUP/RESTORE, so the S3 location
 * and keys are spliced into the statement, after strict checks. ClickHouse
 * hides S3 credentials in its query log and error messages.
 */
export type R2Config = { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string };

export type Database = {
  run(sql: string): Promise<void>;
  rowCounts(database: string): Promise<Record<string, number>>;
};

export function r2FromEnv(env: NodeJS.ProcessEnv): R2Config {
  const config = {
    endpoint: env.R2_ENDPOINT ?? "",
    bucket: env.R2_BUCKET ?? "",
    accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
  };
  const names = ["R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
  const missing = names.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing R2 settings: ${missing.join(", ")}`);
  if (!/^https:\/\/[a-z0-9.-]+$/.test(config.endpoint.replace(/\/$/, ""))) {
    throw new Error("R2_ENDPOINT must look like https://<account>.eu.r2.cloudflarestorage.com");
  }
  if (!/^[a-z0-9-]{3,63}$/.test(config.bucket)) throw new Error("R2_BUCKET is not a valid bucket name");
  if (!/^[A-Za-z0-9]{16,128}$/.test(config.accessKeyId) || !/^[A-Za-z0-9]{16,128}$/.test(config.secretAccessKey)) {
    throw new Error("R2 keys must be letters and digits only");
  }
  return { ...config, endpoint: config.endpoint.replace(/\/$/, "") };
}

/**
 * Safe clues for a failed login to R2, without revealing the keys: the
 * endpoint's host, whether it is the EU one, and the keys' lengths (R2's S3
 * keys are 32 and 64 characters; a Cloudflare API token is 40).
 */
export function describeR2(r2: R2Config): string {
  const host = new URL(r2.endpoint).host;
  const eu = host.includes(".eu.") ? "EU endpoint" : "NOT the EU endpoint";
  return `R2: ${host} (${eu}), bucket ${r2.bucket}, access key ${r2.accessKeyId.length} characters (expected 32), secret ${r2.secretAccessKey.length} characters (expected 64)`;
}

/** e.g. "staging/2026-11-19T0217Z": sorts by time, one folder per environment. */
export function backupPath(environment: string, now: Date): string {
  if (!/^[a-z]+$/.test(environment)) throw new Error(`Unexpected environment name: ${environment}`);
  const stamp = now.toISOString().slice(0, 16).replace(":", "");
  return `${environment}/${stamp}Z`;
}

function s3(r2: R2Config, path: string): string {
  return `S3('${r2.endpoint}/${r2.bucket}/${path}', '${r2.accessKeyId}', '${r2.secretAccessKey}')`;
}

function checkName(database: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error(`Unexpected database name: ${database}`);
  return database;
}

export type BackupResult = { path: string; tables: Record<string, number> };

export async function backupAndVerify(
  db: Database,
  r2: R2Config,
  database: string,
  environment: string,
  now = new Date(),
): Promise<BackupResult> {
  const name = checkName(database);
  const scratch = `${name}_restore_check`;
  const path = backupPath(environment, now);

  await db.run(`DROP DATABASE IF EXISTS ${scratch} SYNC`);
  await db.run(`BACKUP DATABASE ${name} TO ${s3(r2, path)}`);
  try {
    await db.run(`RESTORE DATABASE ${name} AS ${scratch} FROM ${s3(r2, path)}`);
    const original = await db.rowCounts(name);
    const restored = await db.rowCounts(scratch);
    const problems = Object.keys({ ...original, ...restored }).filter((table) => original[table] !== restored[table]);
    if (problems.length) {
      const detail = problems.map((t) => `${t}: ${original[t] ?? "missing"} vs ${restored[t] ?? "missing"}`);
      throw new Error(`Restored backup differs from the database: ${detail.join("; ")}`);
    }
    return { path, tables: original };
  } finally {
    await db.run(`DROP DATABASE IF EXISTS ${scratch} SYNC`);
  }
}
