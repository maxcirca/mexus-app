import { describe, expect, it } from "vitest";
import { READONLY_USER, readonlyUserStatements, setupDatabase } from "./setup.ts";

const password = "abcdefghijklmnopqrstuvwxyz0123456789";

describe("database setup", () => {
  it("creates a read-only user that can only read the app's database", () => {
    const sql = readonlyUserStatements("mexus", password);
    expect(sql[0]).toContain(`CREATE USER IF NOT EXISTS ${READONLY_USER}`);
    expect(sql[0]).toContain("readonly = 2");
    expect(sql[1]).toContain(`ALTER USER ${READONLY_USER}`);
    expect(sql[2]).toBe(`GRANT SELECT ON mexus.* TO ${READONLY_USER}`);
  });

  it("refuses passwords that could break out of the SQL string", () => {
    expect(() => readonlyUserStatements("mexus", "short")).toThrow();
    expect(() => readonlyUserStatements("mexus", `${password}'; DROP DATABASE mexus; --`)).toThrow();
    expect(() => readonlyUserStatements("mexus; DROP", password)).toThrow();
  });

  it("runs the statements in order, and skips the user without a password", async () => {
    const ran: string[] = [];
    const run = async (sql: string) => ran.push(sql);
    await setupDatabase(run, { CLICKHOUSE_DB: "mexus", MEXUS_READONLY_PASSWORD: password });
    expect(ran).toHaveLength(3);
    expect(await setupDatabase(run, {})).toEqual(["no MEXUS_READONLY_PASSWORD: read-only user skipped"]);
    expect(ran).toHaveLength(3);
  });

  it("keeps the password out of error messages", async () => {
    const run = async (sql: string) => {
      throw new Error(`Syntax error in: ${sql}`);
    };
    const failure = setupDatabase(run, { MEXUS_READONLY_PASSWORD: password });
    await expect(failure).rejects.toThrow("***");
    await expect(setupDatabase(run, { MEXUS_READONLY_PASSWORD: password })).rejects.not.toThrow(password);
  });
});
