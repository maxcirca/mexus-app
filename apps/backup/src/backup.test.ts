import { describe, expect, it } from "vitest";
import { backupAndVerify, backupPath, type Database, describeR2, r2FromEnv } from "./backup.ts";

const env = {
  R2_ENDPOINT: "https://abc123.eu.r2.cloudflarestorage.com",
  R2_BUCKET: "mexus-backups",
  R2_ACCESS_KEY_ID: "a".repeat(32),
  R2_SECRET_ACCESS_KEY: "b".repeat(64),
};
const r2 = r2FromEnv(env);
const now = new Date("2026-11-19T02:17:45Z");

function fakeDb(counts: Record<string, Record<string, number>>) {
  const ran: string[] = [];
  const db: Database = {
    run: async (sql) => {
      ran.push(sql);
    },
    rowCounts: async (name) => counts[name] ?? {},
  };
  return { db, ran };
}

describe("backup", () => {
  it("names backups by environment and time", () => {
    expect(backupPath("staging", now)).toBe("staging/2026-11-19T0217Z");
    expect(() => backupPath("../etc", now)).toThrow();
  });

  it("backs up, restores into a scratch database, compares, and cleans up", async () => {
    const { db, ran } = fakeDb({ mexus: { observations: 12 }, mexus_restore_check: { observations: 12 } });
    const result = await backupAndVerify(db, r2, "mexus", "staging", now);
    expect(result).toEqual({ path: "staging/2026-11-19T0217Z", tables: { observations: 12 } });
    expect(ran[1]).toBe(
      `BACKUP DATABASE mexus TO S3('https://abc123.eu.r2.cloudflarestorage.com/mexus-backups/staging/2026-11-19T0217Z', '${env.R2_ACCESS_KEY_ID}', '${env.R2_SECRET_ACCESS_KEY}')`,
    );
    expect(ran[2]).toMatch(/^RESTORE DATABASE mexus AS mexus_restore_check FROM S3\(/);
    expect(ran.at(-1)).toBe("DROP DATABASE IF EXISTS mexus_restore_check SYNC");
  });

  it("fails when the restored copy differs, and still cleans up", async () => {
    const { db, ran } = fakeDb({ mexus: { observations: 12 }, mexus_restore_check: { observations: 11 } });
    await expect(backupAndVerify(db, r2, "mexus", "staging", now)).rejects.toThrow("observations: 12 vs 11");
    expect(ran.at(-1)).toBe("DROP DATABASE IF EXISTS mexus_restore_check SYNC");
  });

  it("refuses settings that could break out of the statement", () => {
    expect(() => r2FromEnv({ ...env, R2_SECRET_ACCESS_KEY: "x', 'y" })).toThrow();
    expect(() => r2FromEnv({ ...env, R2_ENDPOINT: "https://evil.com/'),('x" })).toThrow();
    expect(() => r2FromEnv({ ...env, R2_BUCKET: undefined })).toThrow("R2_BUCKET");
  });

  it("describes the R2 settings without revealing the keys", () => {
    const text = describeR2(r2);
    expect(text).toContain("abc123.eu.r2.cloudflarestorage.com (EU endpoint)");
    expect(text).toContain("access key 32 characters");
    expect(text).toContain("secret 64 characters");
    expect(text).not.toContain(env.R2_ACCESS_KEY_ID);
    expect(text).not.toContain(env.R2_SECRET_ACCESS_KEY);
    expect(describeR2({ ...r2, endpoint: "https://abc123.r2.cloudflarestorage.com" })).toContain("NOT the EU endpoint");
  });
});
