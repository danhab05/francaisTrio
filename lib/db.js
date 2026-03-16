import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "trio-progress.sqlite");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS trio_statuses (
    trio_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL CHECK(status IN ('new', 'review', 'known')),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

export function getAllStatuses() {
  const rows = db.prepare("SELECT trio_id, status FROM trio_statuses").all();
  return Object.fromEntries(rows.map((row) => [row.trio_id, row.status]));
}

export function setStatus(trioId, status) {
  db.prepare(
    `
      INSERT INTO trio_statuses (trio_id, status, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(trio_id)
      DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
    `
  ).run(trioId, status);
}

export function resetStatuses() {
  db.prepare("DELETE FROM trio_statuses").run();
}
